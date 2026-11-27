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
  const EMAIL_RELAY = "https://subscribe.metalsandmachines.com";

  // Animations on or off (the "Animations" switch in the nav; founder, 2026-11-13: some visitors are sensitive to
  // movement and flicker). The visitor's choice is kept in this browser ("mm-motion"); without one the site follows
  // the system setting "reduce motion". data-motion="off" on <html> stops every CSS animation and transition
  // (style.css); the scripts below ask motionOff() each time they are about to move something, so the switch
  // works at once, without reloading. Scripts that have something to undo listen to the "mm:motion" event.
  const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function storedMotion() {
    try { const v = localStorage.getItem("mm-motion"); return v === "on" || v === "off" ? v : ""; } catch (e) { return ""; }
  }
  function applyMotion() {
    document.documentElement.setAttribute("data-motion", storedMotion() || (systemReduce.matches ? "off" : "on"));
  }
  const motionOff = () => document.documentElement.getAttribute("data-motion") === "off";
  applyMotion();

  // Radar ping: the normal pointer stays; entering a link or a button sends one blue ring out from the pointer.
  // Mouse and trackpad only, and never while animations are off.
  function initCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.addEventListener("pointerover", (e) => {
      if (motionOff()) return;
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
    // A ring caught mid-flight when animations are switched off would never end: take it away.
    document.addEventListener("mm:motion", () => { if (motionOff()) document.querySelectorAll(".cursor-ping").forEach((p) => p.remove()); });
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
    if (isNaN(target) || motionOff()) return;
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
        if (motionOff()) return;
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
    if (slides.length < 2) return;
    let index = 0;
    setInterval(() => {
      if (motionOff()) return;
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
    if (!phone) return;
    let queued = false;
    const update = () => {
      queued = false;
      // Animations off: the phone stands straight.
      if (motionOff()) { phone.style.removeProperty("--tilt"); phone.style.removeProperty("--tilt-scale"); return; }
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
    document.addEventListener("mm:motion", update);
    update();
  }

  // Home hero: a film that plays as you scroll. Each act is a public-domain clip cut into frames
  // (tools/extract-frames.mjs writes assets/film/<act>/f001.webp …). The section is 430vh tall and its inside sticks
  // to the screen: how far you are through it picks the frame drawn on the canvas, so scrolling down plays the film
  // and scrolling up rewinds it. An act opens through a ring growing from the centre, like a radar ping.
  // Phones and data saver never load the frames: they get three stills fading into each other.
  // With animations off (the nav's switch) it is a plain hero over one still, on every device.
  function initHeroFilm() {
    const film = document.querySelector("[data-film]");
    if (!film) return;
    const stills = Array.from(film.querySelectorAll(".film-still"));
    const conn = navigator.connection || {};
    const canvas = film.querySelector(".film-canvas");
    const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    // An act is a run of video frames ("metals:64") or a photo in depth layers ("energy:layers"): the layers, from the
    // farthest to the nearest, move at different speeds as the page scrolls (founder, 2026-11-26).
    const LAYERS = { energy: ["energy-photo.webp"], machines: ["machines-photo.webp", "machines-jets.webp"] };
    const acts = (film.dataset.filmActs || "").split(",")
      .map((s) => {
        const [name, kind] = s.trim().split(":");
        const files = kind === "layers" ? LAYERS[name] || [] : null;
        return { name, files, count: files ? files.length : Number(kind), frames: [], asked: false, loaded: 0 };
      })
      .filter((a) => a.name && a.count > 0);

    // The nav keeps the film's dark palette for as long as the film is under it.
    const underNav = () => document.body.classList.toggle("film-on", film.getBoundingClientRect().bottom > 100);
    underNav();
    window.addEventListener("scroll", underNav, { passive: true });

    // Can this device play the film at all? "3g" is not excluded: desktop browsers report it on good connections
    // too (it is an estimate). Browsers without "overflow: clip" keep body as a scrolling box (style.css), where
    // the film could not stick.
    const sticks = window.CSS && CSS.supports && CSS.supports("overflow-x", "clip");
    const canFilm = ctx && acts.length && sticks && !conn.saveData && !/2g$/.test(conn.effectiveType || "") && !window.matchMedia("(max-width: 860px)").matches;

    if (!canFilm) {
      // The stills fade into each other while animations are on; off, the first one stays.
      if (stills.length < 2) return;
      let shown = 0;
      const show = (n) => { stills.forEach((img, k) => img.classList.toggle("is-on", k === n)); shown = n; };
      const fetchStills = () => stills.forEach((img) => { if (img.dataset.src && !img.getAttribute("src")) img.src = img.dataset.src; });
      if (!motionOff()) fetchStills();
      setInterval(() => {
        if (motionOff()) return;
        fetchStills();
        const next = (shown + 1) % stills.length;
        if (stills[next].complete && stills[next].naturalWidth) show(next);
      }, 5200);
      document.addEventListener("mm:motion", () => { if (motionOff()) show(0); });
      return;
    }

    const intro = film.querySelector("[data-film-intro]");
    const beats = Array.from(film.querySelectorAll("[data-film-beat]"));
    const bar = film.querySelector(".film-bar");
    const steps = Array.from(film.querySelectorAll(".film-steps li"));
    const INTRO_END = 0.07;   // the headline leaves once the film has clearly started
    const WIPE = 0.045;       // share of the scroll an act takes to open through the ring
    const share = 1 / acts.length;
    acts.forEach((a, i) => { a.from = i * share; a.to = (i + 1) * share; });

    const pad = (n) => String(n).padStart(3, "0");
    let on = false;           // the film is running; false = the plain hero (animations off)
    let wanted = "";          // what the last draw was asked to show, to skip identical redraws
    let playing = false;
    let queued = false;
    function schedule() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
    function load(i) {
      const act = acts[i];
      if (!act || act.asked) return;
      act.asked = true;
      for (let k = 0; k < act.count; k++) {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          act.frames[k] = img;
          act.loaded++;
          if (act.loaded === act.count) load(i + 1);   // one act at a time, in order
          wanted = "";
          schedule();
        };
        img.src = act.files ? "assets/film/" + act.files[k] : "assets/film/" + act.name + "/f" + pad(k + 1) + ".webp";
      }
    }
    // A layered act can be drawn once all its layers are in; a video act as soon as any frame is.
    const ready = (act, local) => (act.files ? act.loaded === act.count : !!frameOf(act, local));
    const rnd = (k, s) => { const v = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
    // Draws img over the canvas, zoomed by z around the anchor (ax, ay), moved by (dx, dy), turned by rot.
    function coverAt(img, z, ax, ay, dx, dy, rot) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const s = Math.max(canvas.width / iw, canvas.height / ih) * z;
      const w = iw * s, h = ih * s;
      ctx.save();
      ctx.translate(canvas.width * ax + (dx || 0), canvas.height * ay + (dy || 0));
      if (rot) ctx.rotate(rot);
      ctx.drawImage(img, -w * ax, -h * ay, w, h);
      ctx.restore();
    }
    function paint(act, local, t) {
      if (act.files && act.name === "energy") return paintEnergy(act, local, t);
      if (act.files && act.name === "machines") return paintMachines(act, local, t);
      const img = frameOf(act, local);
      if (img) cover(img);
      if (act.name === "metals") sparks(local, t);
    }
    // 01 Metals: sparks fly up from the fire, the nearest plane, rising faster than the film as the page scrolls.
    function sparks(local, t) {
      // Not over the first screen's words: the sparks come in once the headline has gone.
      const show = Math.min(1, Math.max(0, (local * share - INTRO_END) / 0.03));
      if (!show) return;
      const W = canvas.width, H = canvas.height, lift = -local * 0.18 * H;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      const unit = Math.max(1, W / 900);
      for (let k = 0; k < 80; k++) {
        const r1 = rnd(k, 1), r2 = rnd(k, 2), r3 = rnd(k, 3);
        const life = 1.1 + r1 * 1.4, a = (t / life + r2) % 1, age = a * life;
        const vx = (r3 - 0.5) * 0.26 * W, vy = -(0.25 + r1 * 0.5) * H;
        const x = W * (0.5 + (r2 - 0.5) * 0.12) + vx * age;
        const y = H * 0.74 + vy * age + 0.35 * H * age * age + lift;
        const fade = show * (1 - a) * Math.min(1, a * 8);
        const tx = x - vx * 0.045, ty = y - (vy + 0.7 * H * age) * 0.045;
        // A wide orange glow under a thin white-hot core.
        ctx.strokeStyle = "rgba(255, 120, 30, " + (0.45 * fade).toFixed(3) + ")";
        ctx.lineWidth = unit * (3.5 + 2 * r3);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.strokeStyle = "rgba(255, " + Math.round(200 + 50 * (1 - a)) + ", " + Math.round(120 + 110 * (1 - a)) + ", " + fade.toFixed(3) + ")";
        ctx.lineWidth = unit * (1.2 + r3);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
      }
      ctx.restore();
    }
    // 02 Energy: the reactor pool zooms slowly, the glowing core (the same photo, faded towards its edges) comes
    // forward faster and breathes, blue specks rise in front.
    function paintEnergy(act, local, t) {
      const img = act.frames[0];
      if (!act.core) {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        // Solid over the core, fading only at its rim, so the two planes never show the same detail twice.
        const r = g.createRadialGradient(c.width * 0.5, c.height * 0.47, c.width * 0.24, c.width * 0.5, c.height * 0.47, c.width * 0.33);
        r.addColorStop(0, "rgba(0,0,0,1)"); r.addColorStop(1, "rgba(0,0,0,0)");
        g.globalCompositeOperation = "destination-in"; g.fillStyle = r; g.fillRect(0, 0, c.width, c.height);
        act.core = c;
      }
      const W = canvas.width, H = canvas.height;
      coverAt(img, 1.04 + 0.07 * local, 0.5, 0.47, 0, (0.5 - local) * 0.02 * H);
      coverAt(act.core, 1.04 + 0.17 * local, 0.5, 0.47, 0, (0.5 - local) * 0.04 * H);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.14 + 0.14 * (0.5 + 0.5 * Math.sin(t * 2.1));
      coverAt(act.core, 1.04 + 0.17 * local, 0.5, 0.47, 0, (0.5 - local) * 0.04 * H);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 90; k++) {
        const r1 = rnd(k, 4), r2 = rnd(k, 5), r3 = rnd(k, 6);
        const a = (t / (6 + r1 * 8) + r2) % 1;
        const x = W * (0.12 + 0.76 * r3) + Math.sin(t * 0.8 + k) * 0.012 * W;
        const y = H * (1.08 - a * 1.25) - local * 0.3 * H;
        const rad = (1 + r1 * 2.6) * W / 1300;
        ctx.fillStyle = "rgba(150, 215, 255, " + (0.6 * Math.sin(Math.PI * a)).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // 03 Machines: the desert drifts slowly, the two jets (cut out of the same photo) move faster and sway a little,
    // thin veils of cloud pass in front, fastest of all.
    function paintMachines(act, local, t) {
      const [bg, jets] = act.frames;
      const W = canvas.width, H = canvas.height;
      // Framed a little low, so the X-62A (top left) stays clear of the nav.
      coverAt(bg, 1.08 + 0.04 * local, 0.5, 0.5, (local - 0.5) * 0.06 * W + Math.sin(t * 0.3) * 0.006 * W, 0.05 * H);
      coverAt(jets, 1.05 + 0.08 * local, 0.5, 0.5, -local * 0.04 * W, 0.06 * H + Math.sin(t * 0.9) * 0.005 * H, -0.01 * local);
      ctx.save();
      for (let k = 0; k < 5; k++) {
        const r1 = rnd(k, 7), r2 = rnd(k, 8), r3 = rnd(k, 9);
        const x = (((r2 * 1.6 + t * 0.035 * (1 + r1) + local * 0.9) % 1.6) - 0.3) * W;
        const y = H * (0.1 + 0.8 * r3), rx = (0.22 + 0.16 * r1) * W, ry = rx * 0.28;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, "rgba(255, 250, 244, " + (0.22 + 0.14 * r1).toFixed(3) + ")"); g.addColorStop(1, "rgba(255, 250, 244, 0)");
        ctx.fillStyle = g;
        ctx.setTransform(1, 0, 0, ry / rx, 0, y - y * ry / rx);
        ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.restore();
    }
    // The nearest frame already loaded, so a slow connection shows a slightly older picture rather than a hole.
    function frameOf(act, local) {
      const k = Math.round(Math.min(Math.max(local, 0), 1) * (act.count - 1));
      for (let d = 0; d < act.count; d++) {
        if (act.frames[k - d]) return act.frames[k - d];
        if (act.frames[k + d]) return act.frames[k + d];
      }
      return null;
    }
    function cover(img) {
      const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; wanted = ""; }
    }
    function progress() {
      const span = film.offsetHeight - window.innerHeight;
      return span > 0 ? Math.min(Math.max(-film.getBoundingClientRect().top / span, 0), 1) : 0;
    }
    function draw() {
      queued = false;
      if (!on) return;
      const p = progress();
      const i = Math.min(Math.floor(p / share), acts.length - 1);
      const act = acts[i];
      const local = (p - act.from) / share;
      // Captions, bar and nav follow the same progress.
      if (intro) intro.classList.toggle("is-off", p > INTRO_END);
      film.classList.toggle("is-past-intro", p > INTRO_END);
      if (bar) bar.classList.toggle("is-on", p > INTRO_END && p < 0.995);
      beats.forEach((b, n) => b.classList.toggle("is-on", n === i && local > (n === 0 ? 0.34 : 0.2) && local < 0.93));
      steps.forEach((s, n) => s.classList.toggle("is-on", n === i));
      underNav();
      if (p > act.from + share * 0.35) load(i + 1);

      // The layers and the sparks live on their own, so every frame is drawn (the loop below runs only while the
      // film is on screen).
      const t = performance.now() / 1000;
      const wipe = i > 0 ? (p - act.from) / WIPE : 1;
      const prevAct = wipe < 1 ? acts[i - 1] : null;
      const has = ready(act, local), hadPrev = prevAct && ready(prevAct, 1);
      if (!has && !hadPrev) return;
      wanted = "";
      if (hadPrev) {
        // The new act shows through a ring that grows from the centre until it covers the screen.
        paint(prevAct, 1, t);
        if (has) {
          const eased = 1 - Math.pow(1 - wipe, 2);
          const r = eased * Math.hypot(canvas.width, canvas.height) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
          ctx.clip();
          paint(act, local, t);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(2, canvas.width / 480);
          ctx.strokeStyle = "rgba(226, 196, 120, " + (0.85 * (1 - wipe)).toFixed(3) + ")";   // gold ring
          ctx.stroke();
        }
      } else {
        paint(act, local, t);
      }
      if (!playing) { playing = true; film.classList.add("is-playing"); }
    }
    // While the film is on and in view, it is drawn every frame (the sparks, specks, clouds and the core's glow move
    // on their own); off screen or with animations off, nothing runs.
    let looping = false;
    function loop() {
      if (!on) { looping = false; return; }
      const r = film.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) draw();
      requestAnimationFrame(loop);
    }
    // Each act's title comes in word by word, from blurred and tilted to sharp (style.css, .film-word).
    // Words inside an <em> (the act's key words, in its sector's colour) stay inside it.
    beats.forEach((b) => {
      const h = b.querySelector("h2");
      if (!h || h.dataset.split) return;
      h.dataset.split = "1";
      h.setAttribute("aria-label", h.textContent.trim().replace(/\s+/g, " "));
      let n = 0;
      const addWords = (text, parent) => text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { parent.append(" "); return; }
        const s = document.createElement("span");
        s.className = "film-word";
        s.setAttribute("aria-hidden", "true");
        s.style.setProperty("--i", n++);
        s.textContent = part;
        parent.append(s);
      });
      const nodes = Array.from(h.childNodes);
      h.textContent = "";
      nodes.forEach((node) => {
        if (node.nodeType === 3) { addWords(node.textContent, h); return; }
        const box = node.cloneNode(false);
        h.append(box);
        addWords(node.textContent, box);
      });
    });

    // Film or plain hero, following the Animations switch. The section is 330vh taller as a film: when it changes
    // above the visitor, the scroll position moves by the same amount so the page does not jump under their eyes;
    // a visitor who was inside the film goes back to its top.
    function setMode() {
      const want = !motionOff();
      if (want === on) return;
      const r = film.getBoundingClientRect();
      // Some browsers move the scroll position by themselves when content above grows, others don't: switch that
      // off for this change and do it here, measured on the film's own bottom edge.
      const html = document.documentElement;
      html.style.overflowAnchor = "none";
      on = want;
      film.classList.toggle("is-film", on);
      if (on) {
        resize();
        wanted = "";
        if (document.readyState === "complete") load(0);
        if (!looping) { looping = true; requestAnimationFrame(loop); }
      } else {
        playing = false;
        film.classList.remove("is-playing");
        if (intro) intro.classList.remove("is-off");
        if (bar) bar.classList.remove("is-on");
        beats.forEach((b) => b.classList.remove("is-on"));
      }
      if (r.bottom <= 0) window.scrollBy({ top: film.getBoundingClientRect().bottom - r.bottom, behavior: "instant" });
      else if (r.top < 0) window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() => { html.style.overflowAnchor = ""; });
      underNav();
      schedule();
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", () => { if (on) { resize(); schedule(); } });
    // The first screen is the still: the frames start loading once the page itself has finished.
    window.addEventListener("load", () => { if (on) load(0); }, { once: true });
    document.addEventListener("mm:motion", setMode);
    setMode();
  }

  // The seal on the home page (founder, 2026-11-27: "a cool animation, like it grows"). It grows in large behind
  // the headline, as a faint engraving, then shrinks, turns once and lands in the middle of the nav as you scroll
  // the first half screen. Two copies share one path: the large one lives in the film, behind the words; the nav's
  // own copy takes over as the seal reaches the bar (the nav sits above the film, so the film's copy would pass
  // under the bar's frosted background). Without the film (phones, "reduce motion", the Animations switch) the
  // seal simply rests in the nav.
  function initSeal() {
    const hero = document.querySelector(".hero-seal");
    const navSeal = document.querySelector(".nav-seal");
    const film = document.querySelector("[data-film]");
    const nav = document.querySelector(".nav");
    if (!hero || !navSeal || !film || !nav) return;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
    let looping = false, lastEvent = performance.now(), start = null;
    function measure(W, H) {
      const top = film.querySelector(".film-copy .eyebrow"), end = film.querySelector(".film-hint") || film.querySelector(".film-copy");
      const stage = hero.parentElement.getBoundingClientRect();
      let a = H * 0.2, b = H * 0.8;
      if (top && end && end.getBoundingClientRect().height) { a = top.getBoundingClientRect().top - stage.top; b = end.getBoundingClientRect().bottom - stage.top; }
      const r = ((b - a) / 2 + 18) / 0.67;
      return { w: W, h: H, d0: Math.min(2 * r, W * 0.92), x0: W / 2, y0: stage.top + (a + b) / 2 };
    }

    function rest() {
      document.body.classList.remove("seal-flying");
      for (const el of [hero, navSeal]) {
        el.style.width = el.style.height = el.style.transform = el.style.opacity = "";
        ["--seal-turn", "--seal-a", "--seal-ring-a", "--seal-core-a"].forEach((v) => el.style.removeProperty(v));
      }
    }
    function frame() {
      looping = false;
      if (!film.classList.contains("is-film") || motionOff()) { rest(); return; }
      const W = window.innerWidth, H = window.innerHeight;
      const p = clamp(window.scrollY / (0.5 * H));
      if (p >= 1) { rest(); return; }
      document.body.classList.add("seal-flying");
      // Where the nav's seal rests (its margins centre it; its transform is ours).
      const box = navSeal.offsetParent.getBoundingClientRect();
      const d1 = navSeal.offsetWidth;
      const x1 = box.left + navSeal.offsetLeft + d1 / 2, y1 = box.top + navSeal.offsetTop + d1 / 2;
      // Where it starts: large, centred on the first screen's words, its lettering passing above the kicker and
      // below the scroll hint (the words fill the inner part of the ring: 0.67 of its radius).
      if (!start || start.w !== W || start.h !== H) start = measure(W, H);
      const { d0, x0, y0 } = start;
      // It shrinks first and rises later, so it is small by the time it reaches the bar.
      const k = easeOut(p), m = easeInOut(p);
      const d = d0 + (d1 - d0) * k, x = x0 + (x1 - x0) * m, y = y0 + (y1 - y0) * m;
      const vars = {
        "--seal-turn": (360 * m).toFixed(1) + "deg",
        "--seal-a": (0.55 + 0.45 * smooth(0, 0.5, p)).toFixed(3),
        "--seal-ring-a": (0.5 + 0.5 * smooth(0.15, 0.85, p)).toFixed(3),
        "--seal-core-a": (0.3 + 0.7 * smooth(0.3, 0.9, p)).toFixed(3),
      };
      const navBottom = nav.getBoundingClientRect().bottom;
      const handoff = smooth(navBottom + 46, navBottom + 6, y);    // as its centre reaches the bar
      const stage = hero.parentElement.getBoundingClientRect();
      hero.style.width = hero.style.height = d.toFixed(1) + "px";
      hero.style.transform = "translate(" + (x - stage.left - d / 2).toFixed(1) + "px, " + (y - stage.top - d / 2).toFixed(1) + "px)";
      hero.style.opacity = handoff >= 1 ? "0" : "1";
      navSeal.style.transform = "translate(" + (x - x1).toFixed(1) + "px, " + (y - y1).toFixed(1) + "px) scale(" + (d / d1).toFixed(3) + ")";
      navSeal.style.opacity = handoff.toFixed(3);
      for (const el of [hero, navSeal]) for (const v in vars) el.style.setProperty(v, vars[v]);
      // The nav changes height when it gets its background: keep following it for a moment after each scroll.
      if (performance.now() - lastEvent < 700) schedule();
    }
    function schedule() { if (!looping) { looping = true; requestAnimationFrame(frame); } }
    const onEvent = () => { lastEvent = performance.now(); schedule(); };
    window.addEventListener("scroll", onEvent, { passive: true });
    window.addEventListener("resize", onEvent);
    document.addEventListener("mm:motion", onEvent);
    frame();
  }

  // Past issues: data/issues.json lists every free issue really sent to the public channel, newest first. The home
  // page's phone shows the newest one and archive.html lists them all. Both pages already hold the first issue as
  // plain HTML, so nothing is lost if the file cannot be read. Everything goes in as text, never as HTML.
  function initIssues() {
    const phone = document.querySelector("[data-latest-issue]");
    const list = document.querySelector("[data-archive]");
    if (!phone && !list) return;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
    const when = (date, opts) => new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
    const photoOf = (issue) => {
      const p = issue.photo;
      if (!p || !/^assets\/img\/issues\/[\w.-]+$/.test(p.src || "")) return null;
      const img = el("img");
      img.src = p.src; img.alt = p.alt || ""; img.loading = "lazy";
      return img;
    };
    const line = (tag, l) => { const p = el(tag); p.append((l.mark ? l.mark + " " : ""), el("b", "", l.sector || ""), " — " + (l.text || "")); return p; };

    function renderPhone(issue) {
      const bubble = el("div", "tg-bubble");
      const img = photoOf(issue);
      if (img) bubble.appendChild(img);
      const text = el("div", "tg-text");
      const head = el("p");
      head.append(el("b", "", "METALS & MACHINES · WEEKLY" + (issue.no ? " #" + issue.no : "")), el("br"), el("b", "", issue.title));
      const quote = el("p", "tg-quote");
      quote.append(el("b", "", "Disclosure"), el("br"), "The watchlist is built from the largest holdings of three reference ETFs…");
      text.append(head, el("p", "tg-rule", "──────────────"), (() => { const p = el("p"); p.appendChild(el("b", "", "THE WEEK IN 60 SECONDS")); return p; })(),
        ...issue.lines.map((l) => line("p", l)), quote, el("span", "tg-time", issue.time || "09:00"));
      bubble.appendChild(text);
      phone.replaceChildren(el("span", "tg-day", when(issue.date, { weekday: "long", month: "long", day: "numeric" })), bubble);
      const note = document.querySelector("[data-issue-note]");
      if (note) note.textContent = "Sent to the free channel on " + when(issue.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + ", exactly as shown.";
    }

    // The page of an issue (issues/<slug>.html, written by tools/build-issue-pages.mjs), when it has one.
    const pageOf = (issue) => (issue.page && /^[a-z0-9-]+$/.test(issue.page.slug || "") ? "issues/" + issue.page.slug + ".html" : null);
    const link = (href, text, cls) => { const a = el("a", cls || "", text); a.href = href; return a; };
    const CARD_LIMIT = 12; // about three months as full cards; older issues as one line each, by month

    function renderOlder(older) {
      let box = document.querySelector("[data-archive-older]");
      if (!older.length) { if (box) box.remove(); return; }
      if (!box) { box = el("section", "issue-older"); box.setAttribute("data-archive-older", ""); list.after(box); }
      const parts = [el("h2", "", "Earlier issues")];
      let month = "", ul = null;
      older.forEach((issue) => {
        const m = when(issue.date, { month: "long", year: "numeric" });
        if (m !== month) { month = m; ul = el("ul"); parts.push(el("h3", "", m), ul); }
        const text = "Weekly #" + issue.no + " · " + when(issue.date, { month: "short", day: "numeric" }) + " — " + issue.title;
        const li = el("li");
        const href = pageOf(issue);
        li.appendChild(href ? link(href, text) : el("span", "", text));
        ul.appendChild(li);
      });
      box.replaceChildren(...parts);
    }

    function renderArchive(all) {
      const issues = all.slice(0, CARD_LIMIT);
      renderOlder(all.slice(CARD_LIMIT));
      list.replaceChildren(...issues.map((issue) => {
        const card = el("article", "issue-card");
        const href = pageOf(issue);
        const h2 = el("h2");
        h2.appendChild(href ? link(href, issue.title) : document.createTextNode(issue.title));
        card.append(el("p", "issue-meta", when(issue.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + (issue.no ? " · Weekly #" + issue.no : "")), h2);
        const img = photoOf(issue);
        if (img) {
          const fig = el("figure", "issue-photo");
          const cap = el("figcaption", "", (issue.photo.caption || "") + " ");
          if (/^https:\/\/commons\.wikimedia\.org\//.test(issue.photo.link || "")) {
            const a = el("a", "", issue.photo.credit || "Source");
            a.href = issue.photo.link; a.target = "_blank"; a.rel = "noopener";
            cap.appendChild(a);
          } else cap.append(issue.photo.credit || "");
          fig.append(img, cap);
          card.appendChild(fig);
        }
        const ul = el("ul", "issue-lines");
        ul.append(...issue.lines.map((l) => line("li", l)));
        card.append(el("h3", "", "The week in 60 seconds"), ul);
        if (issue.pro) { const p = el("p", "issue-pro"); p.append(el("b", "", "In Pro that week: "), issue.pro); card.appendChild(p); }
        if (href) card.appendChild(link(href, "Read the issue, with a preview of the Pro part →", "issue-open"));
        return card;
      }));
    }

    fetch("data/issues.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const issues = (data && Array.isArray(data.issues) ? data.issues : [])
          .filter((i) => i && /^\d{4}-\d{2}-\d{2}$/.test(i.date || "") && i.title && Array.isArray(i.lines) && i.lines.length)
          .sort((a, b) => b.date.localeCompare(a.date));
        if (!issues.length) return;
        if (phone) renderPhone(issues[0]);
        if (list) renderArchive(issues);
      })
      .catch(() => { /* the page keeps the issue written in its HTML */ });
  }

  // Pro alerts (founder, 2026-11-22): the next check in New York time, and an example alert that arrives when the
  // section comes into view (notification, then the text typed). Without animations everything is shown as written.
  // The text is in the HTML; the script only hides and retypes it.
  function nextCheckText() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = Number(parts.hour) * 60 + Number(parts.minute);
    if (day < 0) return "7:30 AM or 5:30 PM New York time";
    for (let k = 0; k < 8; k++) {
      const d = (day + k) % 7;
      if (d === 0) continue; // Monday to Saturday only
      for (const slot of [450, 1050]) {
        if (k === 0 && slot <= now) continue;
        const time = slot === 450 ? "7:30 AM" : "5:30 PM";
        return (k === 0 ? "today, " : k === 1 ? "tomorrow, " : names[d] + ", ") + time + " New York time";
      }
    }
    return "7:30 AM or 5:30 PM New York time";
  }

  function initAlertDemo() {
    const next = document.querySelector("[data-next-check]");
    if (next) next.textContent = "Next check: " + nextCheckText();
    const box = document.querySelector("[data-alert-demo]");
    if (!box || motionOff() || !("IntersectionObserver" in window)) return;
    const paras = Array.from(box.querySelectorAll("[data-type]"));
    const nodes = paras.map((p) => (p.lastChild && p.lastChild.nodeType === 3 ? p.lastChild : null));
    const full = nodes.map((n) => (n ? n.textContent : ""));
    const finish = () => {
      nodes.forEach((n, i) => { if (n) n.textContent = full[i]; });
      paras.forEach((p) => p.classList.remove("typing"));
      box.classList.remove("is-waiting");
      box.classList.add("is-live");
    };
    box.classList.add("is-waiting");
    nodes.forEach((n) => { if (n) n.textContent = ""; });
    document.addEventListener("mm:motion", () => { if (motionOff()) finish(); });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      box.classList.remove("is-waiting");
      box.classList.add("is-live");
      let i = 0, c = 0;
      const step = () => {
        if (motionOff()) { finish(); return; }
        if (i >= nodes.length) return;
        if (!nodes[i]) { i++; step(); return; }
        paras[i].classList.add("typing");
        c += 2;
        nodes[i].textContent = full[i].slice(0, c);
        if (c >= full[i].length) { paras[i].classList.remove("typing"); i++; c = 0; setTimeout(step, 260); }
        else setTimeout(step, 18);
      };
      setTimeout(step, 1400);
    }, { threshold: 0.35 });
    io.observe(box);
  }

  // How it works: the three steps of the circuit light up one after the other when it comes into view.
  function initCircuit() {
    const circuit = document.querySelector("[data-circuit]");
    if (!circuit) return;
    const steps = Array.from(circuit.querySelectorAll(".circuit-step"));
    const light = () => steps.forEach((s, i) => setTimeout(() => s.classList.add("is-on"), motionOff() ? 0 : 150 + 380 * i));
    if (motionOff() || !("IntersectionObserver" in window)) { light(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { light(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(circuit);
    // Animations switched off before the circuit came into view: every step is simply lit.
    document.addEventListener("mm:motion", () => { if (motionOff()) { light(); io.disconnect(); } });
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

  // Two switches under the site's name in the nav (founder, 2026-11-13: more visible than the old round sun/moon
  // button): "Dark" for
  // the theme and "Animations" for movement. They are real switches (role="switch"): the state shows at a glance
  // and screen readers announce it.
  // Theme: the choice is kept in this browser ("mm-theme", read before the page paints by a one-line script in
  // every page's head); without a choice the site follows the system setting. Animations: see applyMotion above.
  function initSwitches() {
    const brand = document.querySelector(".nav .container > .brand");
    if (!brand) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const theme = () => root.getAttribute("data-theme") || (media.matches ? "light" : "dark");
    const make = (kind, label, thumb) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "switch switch--" + kind;
      b.setAttribute("role", "switch");
      b.innerHTML = '<span class="switch-label">' + label + '</span><span class="switch-track"><span class="switch-thumb">' + thumb + '</span></span><span class="switch-state" aria-hidden="true"></span>';
      return b;
    };
    const dark = make("theme", "Dark",
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>');
    // Play triangle while things move, pause bars once they are stopped.
    const motion = make("motion", "Animations",
      '<svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
      '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>');
    const sync = () => {
      const isDark = theme() === "dark";
      dark.setAttribute("aria-checked", String(isDark));
      dark.setAttribute("aria-label", "Dark mode");
      dark.title = isDark ? "Dark mode is on. Click for light mode." : "Dark mode is off. Click for dark mode.";
      dark.querySelector(".switch-state").textContent = isDark ? "On" : "Off";
      const moving = !motionOff();
      motion.setAttribute("aria-checked", String(moving));
      motion.setAttribute("aria-label", "Animations");
      motion.title = moving ? "Animations are on. Click to stop every animation on this site." : "Animations are off. Click to switch them back on.";
      motion.querySelector(".switch-state").textContent = moving ? "On" : "Off";
    };
    dark.addEventListener("click", () => {
      const next = theme() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("mm-theme", next); } catch (e) { /* storage blocked: the choice lasts for this page */ }
      sync();
    });
    const motionChanged = () => { sync(); document.dispatchEvent(new Event("mm:motion")); };
    motion.addEventListener("click", () => {
      const next = motionOff() ? "on" : "off";
      try { localStorage.setItem("mm-motion", next); } catch (e) { /* storage blocked: the choice lasts for this page */ }
      root.setAttribute("data-motion", next);
      motionChanged();
    });
    if (media.addEventListener) media.addEventListener("change", sync);
    // The system setting changes while the page is open: follow it unless the visitor chose here.
    if (systemReduce.addEventListener) systemReduce.addEventListener("change", () => { if (!storedMotion()) { applyMotion(); motionChanged(); } });
    const box = document.createElement("div");
    box.className = "nav-switches";
    box.append(dark, motion);
    // Under the site's name (style.css places it in the nav's grid).
    brand.insertAdjacentElement("afterend", box);
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
    initSwitches();
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
    initAlertDemo();
    initHeroFilm();
    initSeal();
    initIssues();
    initCityLights();
    initEmailSignup();
    initConfirmEmail();
    initWelcome();
    markActiveNav();
  });

  // City lights on the night map behind the plans (founder, 2026-11-26: "very visible"). The brightest points of the
  // photo itself are found once (it is on this site, so its pixels can be read): they are the real cities. Each one
  // then twinkles on its own rhythm on a canvas laid over the photo, with a halo and a four-point star at its peak.
  // Nothing moves while animations are off or while the section is out of view.
  function initCityLights() {
    const sec = document.querySelector(".section-photo--plans");
    if (!sec || !document.createElement("canvas").getContext) return;
    const img = new Image();
    img.src = "assets/img/plans-night.jpg";
    img.decode().then(() => {
      const spots = findCities(img);
      if (!spots.length) return;
      const cv = document.createElement("canvas");
      cv.className = "city-lights";
      cv.setAttribute("aria-hidden", "true");
      sec.prepend(cv);
      const ctx = cv.getContext("2d");
      const halo = sprite(64, (g, s) => {
        const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        r.addColorStop(0, "rgba(255, 246, 214, 1)"); r.addColorStop(0.18, "rgba(255, 214, 140, .85)");
        r.addColorStop(0.45, "rgba(255, 170, 70, .28)"); r.addColorStop(1, "rgba(255, 150, 50, 0)");
        g.fillStyle = r; g.fillRect(0, 0, s, s);
      });
      const star = sprite(96, (g, s) => {
        const c = s / 2;
        for (const [w, h] of [[s, 2.2], [2.2, s]]) {
          const lg = w > h ? g.createLinearGradient(0, c, s, c) : g.createLinearGradient(c, 0, c, s);
          lg.addColorStop(0, "rgba(255, 236, 190, 0)"); lg.addColorStop(0.5, "rgba(255, 250, 230, 1)"); lg.addColorStop(1, "rgba(255, 236, 190, 0)");
          g.fillStyle = lg; g.fillRect(c - w / 2, c - h / 2, w, h);
        }
      });
      let pts = [], w = 0, h = 0, dpr = 1, running = false, visible = false, raf = 0, last = 0;
      const layout = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = sec.clientWidth;
        // Lower down, the section's own shading hides the map: lights stop where the photo fades out.
        h = Math.min(sec.clientHeight, Math.round(window.innerWidth * (window.innerWidth <= 600 ? 0.8 : 0.6)));
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        cv.style.width = w + "px"; cv.style.height = h + "px";
        const cs = getComputedStyle(sec);
        const [sx] = cs.backgroundSize.split(" ");
        const bw = sx.endsWith("%") ? (parseFloat(sx) / 100) * w : sx === "auto" || sx === "cover" ? w : parseFloat(sx);
        const bh = bw * img.naturalHeight / img.naturalWidth;
        const [px, py] = cs.backgroundPosition.split(" ");
        const pos = (v, free) => (v && v.endsWith("%") ? (parseFloat(v) / 100) * free : parseFloat(v) || 0);
        const ox = pos(px, w - bw), oy = pos(py, sec.clientHeight - bh);
        pts = spots.map((s) => ({ ...s, x: ox + s.u * bw, y: oy + s.v * bh })).filter((p) => p.x > 0 && p.x < w && p.y > 0 && p.y < h);
      };
      const draw = (t) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const p of pts) {
          const wave = Math.max(0, Math.sin((t / p.period + p.phase) * Math.PI * 2));
          const k = 0.18 + 0.82 * Math.pow(wave, 3);
          const r = p.size * (0.7 + 0.6 * k);
          ctx.globalAlpha = Math.min(1, k * 1.1);
          ctx.drawImage(halo, p.x - r, p.y - r, r * 2, r * 2);
          if (k > 0.55) {
            const sr = p.size * 1.7 * k;
            ctx.globalAlpha = (k - 0.55) / 0.45;
            ctx.drawImage(star, p.x - sr, p.y - sr, sr * 2, sr * 2);
          }
        }
        ctx.globalAlpha = 1;
      };
      const loop = (t) => {
        if (!running) return;
        if (t - last > 33) { last = t; draw(t / 1000); }
        raf = requestAnimationFrame(loop);
      };
      const update = () => {
        const go = visible && !motionOff();
        if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
        if (!go && running) { running = false; cancelAnimationFrame(raf); }
        cv.hidden = motionOff();
      };
      layout();
      let rt = 0;
      window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (!running) draw(0); }, 150); });
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; update(); }, { rootMargin: "100px" }).observe(sec);
      document.addEventListener("mm:motion", update);
      update();
    }).catch(() => { /* no lights if the photo cannot be read */ });

    function sprite(size, paint) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      paint(c.getContext("2d"), size);
      return c;
    }
    // The photo scaled to 500 px wide; local brightness peaks, the brightest first, never two closer than 8 px.
    function findCities(image) {
      const W = 500, H = Math.round(W * image.naturalHeight / image.naturalWidth);
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(image, 0, 0, W, H);
      let px;
      try { px = g.getImageData(0, 0, W, H).data; } catch (e) { return []; }
      const lum = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) lum[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
      const peaks = [];
      for (let y = 2; y < H - 2; y++) {
        for (let x = 2; x < W - 2; x++) {
          const v = lum[y * W + x];
          if (v < 120) continue;
          let top = true;
          for (let dy = -2; dy <= 2 && top; dy++) for (let dx = -2; dx <= 2; dx++) if (lum[(y + dy) * W + x + dx] > v) { top = false; break; }
          if (top) peaks.push({ x, y, v });
        }
      }
      peaks.sort((a, b) => b.v - a.v);
      const kept = [];
      for (const p of peaks) {
        if (kept.length >= 170) break;
        if (kept.some((k) => (k.x - p.x) ** 2 + (k.y - p.y) ** 2 < 64)) continue;
        kept.push(p);
      }
      return kept.map((p, i) => ({
        u: p.x / W, v: p.y / H,
        size: 5 + (p.v / 255) * 9,
        period: 1.6 + ((i * 7919) % 100) / 100 * 2.6,
        phase: ((i * 104729) % 1000) / 1000,
      }));
    }
  }

  // Free issue by email (founder, 2026-11-23). The form posts to subscribe.metalsandmachines.com, a relay that passes
  // it to our automation server; a confirmation email follows, and nothing is sent until the reader clicks it.
  function relayPost(path, body) {
    // Never wait forever: after 15 seconds the reader is told to try again.
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;
    return fetch(EMAIL_RELAY + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then((r) => r.json())
      .finally(() => { if (timer) clearTimeout(timer); });
  }

  function initEmailSignup() {
    document.querySelectorAll("[data-email-signup]").forEach((box) => {
      const toggle = box.querySelector("[data-email-toggle]");
      const form = box.querySelector("[data-email-form]");
      const done = box.querySelector("[data-email-done]");
      const msg = box.querySelector("[data-email-msg]");
      const input = form.querySelector('input[name="email"]');
      const button = form.querySelector('button[type="submit"]');
      const say = (text, isError) => { msg.textContent = text; msg.className = "email-msg" + (isError ? " is-error" : ""); };
      toggle.addEventListener("click", () => {
        const open = form.hidden;
        form.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        if (open) input.focus();
      });
      input.addEventListener("input", () => { if (msg.classList.contains("is-error")) say("", false); });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Enter a valid email address.", true); input.focus(); return; }
        button.disabled = true;
        say("Sending…", false);
        relayPost("/signup", { email, website: form.elements.website ? form.elements.website.value : "" })
          .then((a) => {
            if (a && a.ok) { form.hidden = true; toggle.hidden = true; done.hidden = false; done.focus(); return; }
            say((a && a.error) || "Something went wrong. Please try again later.", true);
            button.disabled = false;
          })
          .catch(() => { say("We couldn't reach our server. Please try again in a moment.", true); button.disabled = false; });
      });
    });
  }

  // confirm-email.html: the link in the confirmation email opens this page; the reader's click confirms (mail scanners
  // that open links on their own never press the button).
  function initConfirmEmail() {
    const box = document.querySelector("[data-confirm-email]");
    if (!box) return;
    const show = (name) => box.querySelectorAll("[data-state]").forEach((el) => { el.hidden = el.getAttribute("data-state") !== name; });
    const token = (new URLSearchParams(location.search).get("t") || "").replace(/[^0-9a-fA-F-]/g, "").slice(0, 36);
    if (!token) { show("missing"); return; }
    show("ask");
    const button = box.querySelector("[data-confirm-button]");
    const error = box.querySelector("[data-confirm-error]");
    button.addEventListener("click", () => {
      button.disabled = true;
      error.textContent = "";
      relayPost("/confirm", { token })
        .then((a) => {
          if (a && a.ok) {
            show(a.status === "already" ? "already" : "subscribed");
            try { history.replaceState(null, "", location.pathname); } catch (e) { /* the address keeps the token */ }
            return;
          }
          if (a && a.status === "expired") { show("expired"); return; }
          error.textContent = (a && a.error) || "Something went wrong. Please try again in a few minutes.";
          button.disabled = false;
        })
        .catch(() => { error.textContent = "We couldn't reach our server. Please try again in a moment."; button.disabled = false; });
    });
  }
})();
