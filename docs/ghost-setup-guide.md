# Ghost self-hosted setup (Phase 5, step 13 — done)

Ghost runs in Docker on the same Hostinger VPS as n8n (`srv822151.hstgr.cloud`), behind the same Traefik reverse proxy, at `https://ghost.srv822151.hstgr.cloud` — a temporary subdomain since the brand name (Phase 1) is still paused. Migrating to a real domain later is a DNS change plus a `url` env var update, not a rebuild.

I have no SSH access to the VPS. Every command below was run by the user (partly directly, partly by handing a diagnostic/fix task to Claude for Chrome once the manual back-and-forth over screenshots got slow) — this doc records what actually ended up working, as a reference for reinstalling or debugging later, not a step-by-step to redo from scratch.

## What's running

`docker ps` on the VPS shows, alongside the pre-existing `root-traefik-1` and `root-n8n-1` (untouched throughout):
- `ghost-ghost-1` — Ghost 5 (`ghost:5-alpine`)
- `ghost-db-1` — MySQL 8 (`mysql:8.0`), internal-only

Both come from a single compose file the whole rest of this doc refers to.

## Why Docker instead of `ghost-cli`

The original plan was the officially documented `ghost-cli` install (Node + MySQL + Nginx + certbot, all installed by hand). Once we confirmed the VPS runs n8n via Docker Compose + Traefik (the Hostinger n8n marketplace template), Docker became the much shorter path: no MySQL apt install, no Nginx vhost, no certbot — Traefik already terminates TLS via its `mytlschallenge` ACME resolver and just needs Docker labels on the new container to pick it up.

## `/root/ghost/docker-compose.yml` (the version that works)

```yaml
services:
  ghost:
    image: ghost:5-alpine
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      url: https://ghost.srv822151.hstgr.cloud
      NODE_ENV: production
      database__client: mysql
      database__connection__host: db
      database__connection__user: ghost
      database__connection__password: ${GHOST_DB_PASSWORD}
      database__connection__database: ghost
      security__staffDeviceVerification: "false"
    volumes:
      - ghost_data:/var/lib/ghost/content
    networks:
      - web
      - internal
    labels:
      - traefik.enable=true
      - traefik.docker.network=root_default
      - traefik.http.routers.ghost.rule=Host(`ghost.srv822151.hstgr.cloud`)
      - traefik.http.routers.ghost.entrypoints=web,websecure
      - traefik.http.routers.ghost.tls=true
      - traefik.http.routers.ghost.tls.certresolver=mytlschallenge
      - traefik.http.services.ghost.loadbalancer.server.port=2368

  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ghost
      MYSQL_USER: ghost
      MYSQL_PASSWORD: ${GHOST_DB_PASSWORD}
    volumes:
      - ghost_db:/var/lib/mysql
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p$$MYSQL_ROOT_PASSWORD --silent"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

volumes:
  ghost_data:
  ghost_db:

networks:
  web:
    name: root_default
    external: true
  internal:
    driver: bridge
```

Root and MySQL passwords live in `/root/ghost/.env` on the VPS (`MYSQL_ROOT_PASSWORD`, `GHOST_DB_PASSWORD`) — not in the compose file, not in this repo, not in chat.

Key points if reinstalling:
- **Two networks, not one.** `web` (external, aliased to the same `root_default` network Traefik/n8n already use) so Traefik can route to Ghost; `internal` (a fresh bridge network, Ghost-only) so MySQL is never reachable from anywhere except the Ghost container — no port published to the host at all.
- **`traefik.docker.network=root_default` is required** once a container is on more than one network — without it Traefik can't tell which network to route through and silently fails to pick up the container.
- **`depends_on: db: condition: service_healthy`**, paired with the MySQL healthcheck, makes Compose wait until MySQL actually answers `mysqladmin ping` before starting Ghost. Ghost's entrypoint doesn't retry the DB connection — without this, Ghost's first attempt can race MySQL's first-boot initialization and fail immediately even though the config is otherwise correct.
- **`security__staffDeviceVerification: "false"`** — Ghost's default per-new-device email verification on login would lock you out with no SMTP configured. Re-enable it once real outbound email (Mailgun or SMTP via `mail__*` env vars) is wired up, needed anyway before any newsletter can actually send.

## What went wrong first, for the record

Two earlier attempts failed with `Error: connect ECONNREFUSED 127.0.0.1:3306` even after setting `database__client`/`database__connection__host` correctly — most likely because a `config.production.json` had already been written into the `ghost_data` volume during the very first (SQLite, no MySQL at all) attempt, and kept being read ahead of the environment variables on later runs despite the volume supposedly being removed in between (a `docker volume rm` typed into a terminal that was still attached to a blocking `docker compose logs -f` never actually ran — the shell wasn't reading input). Also confirmed along the way, from Ghost's own Docker Hub docs: the `ghost` image's SQLite support is development-mode only; `NODE_ENV: production` requires a real MySQL/MariaDB, so the SQLite path was a dead end regardless.

## What's next

1. **You**: finish the one-time setup wizard at `https://ghost.srv822151.hstgr.cloud/ghost/` (site title, name, email, password — your account, your password, not something I do).
2. **You**: Settings → Advanced → Integrations → Add custom integration, name it `RADAR`, copy the Admin API Key (`<id>:<secret>`) and API URL.
3. **You**: save those into a new `secrets/ghost.env` (gitignored, same pattern as `secrets/n8n.env`/`secrets/telegram.env`):
   ```
   GHOST_ADMIN_API_URL=https://ghost.srv822151.hstgr.cloud
   GHOST_ADMIN_API_KEY=<the id:secret>
   ```
4. **Me**: once that file exists, wire a Ghost Admin API credential into n8n and add the actual "publish" step to `RADAR – Approval Receiver` (fires on `approve:<issueId>`, calls `POST /ghost/api/admin/posts/`), plus a Track Record page/tag once publishing itself is confirmed working.
