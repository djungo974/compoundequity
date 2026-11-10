/* ==========================================================================
   Metals & Machines — shared interactions
   Custom cursor · sticky nav · scroll reveal · counters · magnetic buttons ·
   hero fade carousel · Telegram / referral / payment links · welcome page
   ========================================================================== */

(function () {
  "use strict";

  // Paid plans are sold through Stripe Payment Links. Until they exist the Pro buttons say "Opens at launch".
  const SITE = {
    bot: "MetalsMachinesBot",
    paymentLinks: { monthly: "", annual: "" },
    // Only real subscribers who agreed to be quoted, e.g. { quote: "…", name: "Daniel R.", role: "Engineer, Texas" }.
    // Never invented (FTC rule on fake reviews). The home page section stays hidden while this list is empty.
    testimonials: [],
  };
  const REF_RE = /^[A-HJ-NP-Z2-9]{6}$/;

  // Radar ping: the normal pointer stays; entering a link or a button sends one blue ring out from the pointer.
  // Mouse and trackpad only, and never for visitors who asked their system to reduce motion.
  function initCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const target = e.target.closest && e.target.closest("a, button, summary, [role='button']");
      if (!target || target.contains(e.relatedTarget)) return;
      const ping = document.createElement("span");
      ping.className = "cursor-ping";
      ping.setAttribute("aria-hidden", "true");
      ping.style.left = e.clientX + "px";
      ping.style.top = e.clientY + "px";
      document.body.appendChild(ping);
      ping.addEventListener("animationend", () => ping.remove());
    });
  }

  function initNavScroll() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    const burger = document.querySelector(".nav-burger");
    const panel = document.querySelector(".mobile-nav");
    const close = document.querySelector(".mobile-close");
    if (!burger || !panel) return;
    const toggle = (open) => panel.classList.toggle("is-open", open);
    burger.addEventListener("click", () => toggle(true));
    if (close) close.addEventListener("click", () => toggle(false));
    panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  function initReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    els.forEach((el) => io.observe(el));
  }

  function animateCounter(el) {
    const match = el.textContent.trim().match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(",", "."));
    if (isNaN(target)) return;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / 1200);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + numStr + suffix;
    })(start);
  }

  function initCounters() {
    const nums = document.querySelectorAll("[data-counter]");
    if (!nums.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  function initMagnetic() {
    if (window.matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
    });
  }

  function initCarousel() {
    const root = document.getElementById("heroCarousel");
    if (!root) return;
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0;
    setInterval(() => {
      index = (index + 1) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    }, 7000);
  }

  // A referral code arrives as ?ref=XXXXXX (a link a reader shared, or our bot's Go Pro button).
  // Nothing is stored in the browser (no cookie banner needed): the code is carried in this site's own
  // links instead, so it still counts if the visitor subscribes a few pages later.
  function referralCode() {
    let code = "";
    try { code = (new URLSearchParams(location.search).get("ref") || "").toUpperCase(); } catch (e) { code = ""; }
    if (!REF_RE.test(code)) return "";
    document.querySelectorAll("a[href]").forEach((a) => {
      const m = /^([a-z0-9-]+\.html)(#.*)?$/i.exec(a.getAttribute("href"));
      if (m) a.setAttribute("href", m[1] + "?ref=" + code + (m[2] || ""));
    });
    return code;
  }

  // Spotlight: a soft light follows the mouse over plan, benefit and sector cards (mouse and trackpad only).
  function initSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll(".plan, .card, .sector-card").forEach((el) => {
      el.classList.add("spot");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      el.addEventListener("pointerleave", () => { el.style.removeProperty("--mx"); el.style.removeProperty("--my"); });
    });
  }

  // "This is what arrives": the Telegram phone leans back and straightens up as it scrolls into view.
  function initPhoneTilt() {
    const phone = document.querySelector("[data-tilt]");
    if (!phone || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let queued = false;
    const update = () => {
      queued = false;
      const r = phone.getBoundingClientRect();
      const h = window.innerHeight;
      // 0 when the phone's top enters the bottom of the screen, 1 once it has risen to 35% from the top.
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * 0.65)));
      phone.style.setProperty("--tilt", (26 * (1 - p)).toFixed(2) + "deg");
      phone.style.setProperty("--tilt-scale", (0.9 + 0.1 * p).toFixed(3));
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  // Home hero: a curved band of photos streaming right to left (geometry after 21st.dev's Tilted Grid Hero).
  // The row runs round the inside of a cylinder: the centre faces you flat, the ends bend toward you and fade.
  // A box can't bend, so each tile is cut into SLICES vertical strips, each turned to its own angle round the
  // cylinder's axis; one rotateY animation per tile carries it along the arc, its delay setting where it starts.
  // A tile takes its next photo each time it wraps, out of sight. Visitors who reduce motion get a still band.
  function initTiltBand() {
    const band = document.querySelector("[data-tilt-band]");
    if (!band || !("ResizeObserver" in window)) return;
    const images = (band.dataset.images || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!images.length) return;
    const SLICES = 16, CAMERA = 1.6, MAX_WIDTH = 55;
    const cfg = { speed: 4.5, tileHeight: 54, aspect: 16 / 9, gap: 6, axis: 48, curve: 70, fade: 12 };
    const bend = Math.min(85, Math.max(5, cfg.curve)) * Math.PI / 180;
    // Cylinder radius, as a share of the band's width, that puts the frame's edge `bend` radians round the arc.
    const arc = (b) => (CAMERA - 1 + Math.cos(b)) / (2 * CAMERA * Math.sin(b));
    const deg = (rad) => rad * 180 / Math.PI;
    const round = (n) => +n.toFixed(4);
    function measure(width, height) {
      const h = Math.min(cfg.tileHeight / 100 * height, MAX_WIDTH / 100 * width / cfg.aspect);
      const radius = width * arc(bend);
      if (!(h > 0) || !(radius > 0)) return null;
      const unit = deg(h / radius);
      const pitch = (cfg.aspect + cfg.gap / 100) * unit;
      const limit = deg(bend) + cfg.aspect * unit / 2;
      const columns = Math.min(60, Math.max(2, Math.ceil(2 * limit / pitch)));
      const sweep = round(columns * pitch / 2);
      return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
    }
    images.forEach((src) => { const im = new Image(); im.src = src; });
    const style = document.createElement("style");
    document.head.appendChild(style);
    const stage = document.createElement("div");
    stage.className = "tilt-stage";
    band.appendChild(stage);
    const shown = {};
    let layout = null;

    function render(L) {
      const { columns, sweep, unit, limit } = L;
      const u = (n) => "calc(" + round(n) + " * min(" + cfg.tileHeight + "cqh, " + round(MAX_WIDTH / cfg.aspect) + "cqw))";
      const r = 100 * arc(bend);
      const radius = round(r) + "cqw";
      const turn = (d) => "translateZ(" + radius + ") rotateY(" + round(d) + "deg) translateZ(-" + radius + ")";
      // Past `limit` a tile is wholly off-screen: hidden there, which is also where the loop wraps.
      const hide = round((sweep - limit) / (2 * sweep || 1) * 100);
      style.textContent =
        "@keyframes tilt-orbit{from{transform:" + turn(-sweep) + "}to{transform:" + turn(sweep) + "}" +
        "0%," + hide + "%," + (100 - hide) + "%,100%{visibility:hidden}" +
        round(hide + 0.001) + "%," + round(100 - hide - 0.001) + "%{visibility:visible}}" +
        "@media (prefers-reduced-motion: reduce){.tilt-tile{animation-play-state:paused}}";
      const share = cfg.aspect / SLICES;
      const duration = columns * cfg.speed;
      const mask = "linear-gradient(90deg,transparent,#000 " + cfg.fade + "%,#000 " + (100 - cfg.fade) + "%,transparent)";
      stage.style.perspective = round(r * CAMERA) + "cqw";
      stage.style.perspectiveOrigin = "50% " + cfg.axis + "%";
      stage.style.maskImage = mask;
      stage.style.webkitMaskImage = mask;
      stage.textContent = "";
      for (let t = 0; t < columns; t++) {
        // Tile columns-1 starts nearest the exit, tile 0 furthest back: `first` numbers them in order of arrival.
        const first = columns - 1 - t;
        const src = images[(shown[t] !== undefined ? shown[t] : first) % images.length];
        const tile = document.createElement("div");
        tile.className = "tilt-tile";
        tile.style.cssText = "left:calc(50% - " + u(cfg.aspect / 2) + ");top:calc(" + cfg.axis + "% - " + u(0.5) + ");width:" + u(cfg.aspect) +
          ";height:" + u(1) + ";animation:tilt-orbit " + duration + "s linear " + (-t * cfg.speed) + "s infinite";
        for (let k = 0; k < SLICES; k++) {
          const strip = document.createElement("div");
          strip.className = "tilt-strip" + (k === 0 ? " is-first" : "") + (k === SLICES - 1 ? " is-last" : "");
          // Every strip starts at the tile's centre and is turned round the axis to its own place on the arc;
          // each is a pixel wider than its share so neighbours overlap and no hairline opens between them.
          strip.style.cssText = "left:" + u((cfg.aspect - share) / 2) + ";width:" + (k === SLICES - 1 ? u(share) : "calc(" + u(share) + " + 1px)") +
            ";height:" + u(1) + ";transform:" + turn((cfg.aspect / 2 - (k + 0.5) * share) * unit);
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.draggable = false;
          img.decoding = "async";
          img.style.cssText = "left:" + u(-k * share) + ";width:" + u(cfg.aspect) + ";height:" + u(1);
          strip.appendChild(img);
          tile.appendChild(strip);
        }
        tile.addEventListener("animationiteration", (e) => {
          // elapsedTime counts whole loops, missed events included.
          const next = Math.round(e.elapsedTime / duration) * columns + first;
          if (shown[t] === next) return;
          shown[t] = next;
          const nextSrc = images[next % images.length];
          tile.querySelectorAll("img").forEach((im) => { im.src = nextSrc; });
        });
        stage.appendChild(tile);
      }
      stage.style.opacity = "1";
    }

    new ResizeObserver(([entry]) => {
      const next = measure(entry.contentRect.width, entry.contentRect.height);
      if (!next) return;
      if (layout && layout.columns === next.columns && layout.sweep === next.sweep && layout.unit === next.unit) return;
      layout = next;
      render(layout);
    }).observe(band);
  }

  // How it works: the three steps of the circuit light up one after the other when it comes into view.
  function initCircuit() {
    const circuit = document.querySelector("[data-circuit]");
    if (!circuit) return;
    const steps = Array.from(circuit.querySelectorAll(".circuit-step"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = () => steps.forEach((s, i) => setTimeout(() => s.classList.add("is-on"), reduce ? 0 : 150 + 380 * i));
    if (reduce || !("IntersectionObserver" in window)) { light(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { light(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(circuit);
  }

  // Every Telegram sign-up button ("Join free on Telegram", "Unlock Pro in Telegram") gets the same look:
  // the animated .btn-tg style (css) and a Telegram plane icon (Tabler "brand-telegram", MIT licence).
  // Pro payment buttons (data-pay) keep their own style.
  function initTelegramButtons() {
    const icon = '<svg class="tg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"/></svg>';
    document.querySelectorAll("a.btn[data-bot-link]:not([data-pay]), a.btn[data-claim]").forEach((a) => {
      a.classList.remove("btn-ghost");
      a.classList.add("btn-primary", "btn-tg");
      if (!a.querySelector(".tg-icon")) a.insertAdjacentHTML("afterbegin", icon);
    });
  }

  // Free sign-ups go through our bot (it counts referrals); Pro buttons go to Stripe with the referral attached.
  function initTelegramLinks() {
    const ref = referralCode();
    const bot = "https://t.me/" + SITE.bot + (ref ? "?start=r_" + ref : "");
    document.querySelectorAll("a[data-bot-link]").forEach((a) => { a.href = bot; });
    document.querySelectorAll("a[data-pay]").forEach((a) => {
      const link = SITE.paymentLinks[a.dataset.pay];
      if (link) {
        a.href = link + (ref ? (link.includes("?") ? "&" : "?") + "client_reference_id=ref_" + ref : "");
      } else {
        a.textContent = "Opens at launch";
        a.setAttribute("aria-disabled", "true");
        a.title = "Paid plans open at launch. Meanwhile, join the free channel.";
      }
    });
    const live = Object.values(SITE.paymentLinks).some(Boolean);
    document.querySelectorAll("[data-prelaunch]").forEach((el) => { el.hidden = live; });
  }

  // welcome.html, where Stripe sends a buyer after paying: turns the checkout session id into the
  // bot link that unlocks the Pro channel. The id is removed from the address bar right away.
  function initWelcome() {
    const box = document.querySelector("[data-welcome]");
    if (!box) return;
    let sid = "";
    try {
      sid = new URLSearchParams(location.search).get("session_id") || new URLSearchParams(location.hash.slice(1)).get("session_id") || "";
      if (sid) history.replaceState(null, "", location.pathname);
    } catch (e) { /* keep sid as read */ }
    const m = /^cs_(test|live)_([A-Za-z0-9]{10,80})$/.exec(sid);
    const btn = box.querySelector("[data-claim]");
    if (!m) {
      btn.hidden = true;
      box.querySelector("[data-claim-missing]").hidden = false;
      return;
    }
    // Telegram start parameters are limited to 64 characters; longer ids are pasted to the bot instead.
    const param = (m[1] === "test" ? "t_" : "l_") + m[2];
    if (param.length <= 64) {
      btn.href = "https://t.me/" + SITE.bot + "?start=" + param;
    } else {
      btn.href = "https://t.me/" + SITE.bot;
      const fallback = box.querySelector("[data-claim-fallback]");
      fallback.querySelector("code").textContent = sid;
      fallback.hidden = false;
    }
  }

  // Sun/moon button in the nav. The visitor's choice is kept in this browser ("mm-theme", read before the page
  // paints by a one-line script in every page's head); without a choice the site follows the system setting.
  function initThemeToggle() {
    const slot = document.querySelector(".nav-right");
    if (!slot) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const current = () => root.getAttribute("data-theme") || (media.matches ? "light" : "dark");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.innerHTML =
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
    const sync = () => {
      const mode = current();
      const next = mode === "light" ? "dark" : "light";
      btn.dataset.mode = mode;
      btn.setAttribute("aria-label", "Switch to " + next + " mode");
      btn.title = "Switch to " + next + " mode";
    };
    btn.addEventListener("click", () => {
      const next = current() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("mm-theme", next); } catch (e) { /* storage blocked: the choice lasts for this page */ }
      sync();
    });
    if (media.addEventListener) media.addEventListener("change", sync);
    slot.insertBefore(btn, slot.firstChild);
    sync();
  }

  // Phones: a slim "Join free on Telegram" bar at the bottom once the visitor is past the first screen.
  // It steps aside while the page's own sign-up block or the footer is on screen.
  function initMobileCta() {
    if (document.querySelector("[data-welcome]") || !document.querySelector("a[data-bot-link]")) return;
    const bar = document.createElement("div");
    bar.className = "mobile-cta";
    const link = document.createElement("a");
    link.href = "https://t.me/" + SITE.bot;
    link.className = "btn btn-primary btn-block";
    link.setAttribute("data-bot-link", "");
    link.textContent = "Join free on Telegram";
    bar.appendChild(link);
    document.body.appendChild(bar);
    const blockers = Array.from(document.querySelectorAll("#subscribe, .footer"));
    const update = () => {
      const h = window.innerHeight;
      const blocked = blockers.some((el) => { const r = el.getBoundingClientRect(); return r.top < h && r.bottom > 0; });
      bar.classList.toggle("is-shown", window.scrollY > h * 0.8 && !blocked);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // Up to three testimonial cards; text is inserted as plain text, never as HTML.
  function initTestimonials() {
    const section = document.querySelector("[data-testimonials]");
    const list = SITE.testimonials.filter((t) => t && t.quote && t.name).slice(0, 3);
    if (!section || !list.length) return;
    const box = section.querySelector("[data-testimonial-list]");
    list.forEach((t) => {
      const fig = document.createElement("figure");
      fig.className = "card testimonial";
      const q = document.createElement("blockquote");
      q.textContent = "“" + t.quote + "”";
      const cap = document.createElement("figcaption");
      const name = document.createElement("b");
      name.textContent = t.name;
      cap.appendChild(name);
      if (t.role) cap.appendChild(document.createTextNode(" · " + t.role));
      fig.append(q, cap);
      box.appendChild(fig);
    });
    section.hidden = false;
  }

  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a, .mobile-nav a, .legal-nav a").forEach((a) => {
      if (a.getAttribute("href").split("?")[0] === path) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initCursor();
    initNavScroll();
    initMobileNav();
    initTestimonials();
    initReveal();
    initCounters();
    initMagnetic();
    initCarousel();
    initMobileCta();
    initTelegramLinks();
    initTelegramButtons();
    initSpotlight();
    initPhoneTilt();
    initCircuit();
    initTiltBand();
    initWelcome();
    markActiveNav();
  });
})();
