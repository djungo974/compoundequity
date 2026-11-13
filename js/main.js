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
    const acts = (film.dataset.filmActs || "").split(",")
      .map((s) => { const [name, count] = s.trim().split(":"); return { name, count: Number(count), frames: [], asked: false, loaded: 0 }; })
      .filter((a) => a.name && a.count > 0);

    // The nav keeps the film's dark palette for as long as the film is under it.
    const underNav = () => document.body.classList.toggle("film-on", film.getBoundingClientRect().bottom > 90);
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
        img.src = "assets/film/" + act.name + "/f" + pad(k + 1) + ".webp";
      }
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
      if (bar) bar.classList.toggle("is-on", p > INTRO_END && p < 0.995);
      beats.forEach((b, n) => b.classList.toggle("is-on", n === i && local > (n === 0 ? 0.34 : 0.2) && local < 0.93));
      steps.forEach((s, n) => s.classList.toggle("is-on", n === i));
      underNav();
      if (p > act.from + share * 0.35) load(i + 1);

      const img = frameOf(act, local);
      const wipe = i > 0 ? (p - act.from) / WIPE : 1;
      const prev = wipe < 1 ? frameOf(acts[i - 1], 1) : null;
      if (!img && !prev) return;
      const key = i + ":" + (img ? img.src : "") + ":" + (prev ? wipe.toFixed(3) : "");
      if (key === wanted) return;
      wanted = key;
      if (prev) {
        // The new act shows through a ring that grows from the centre until it covers the screen.
        cover(prev);
        if (img) {
          const eased = 1 - Math.pow(1 - wipe, 2);
          const r = eased * Math.hypot(canvas.width, canvas.height) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
          ctx.clip();
          cover(img);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(2, canvas.width / 480);
          ctx.strokeStyle = "rgba(168, 198, 232, " + (0.85 * (1 - wipe)).toFixed(3) + ")";
          ctx.stroke();
        }
      } else {
        cover(img);
      }
      if (!playing) { playing = true; film.classList.add("is-playing"); }
    }

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

  // Home headline: the sector word slides up and out every 2.2 s while the next one springs in from below.
  function initRotator() {
    const words = Array.from(document.querySelectorAll(".rot-words .rot-word"));
    if (words.length < 2) return;
    let i = 0;
    setInterval(() => {
      if (motionOff()) return;   // the word on screen stays
      const cur = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      // The next word starts below the line without animating there, then springs in.
      next.classList.add("no-anim");
      next.classList.remove("is-before");
      void next.offsetWidth;
      next.classList.remove("no-anim");
      cur.classList.remove("is-active");
      cur.classList.add("is-before");
      next.classList.add("is-active");
    }, 2200);
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

  // Two switches in the nav (founder, 2026-11-13: more visible than the old round sun/moon button): "Dark" for
  // the theme and "Animations" for movement. They are real switches (role="switch"): the state shows at a glance
  // and screen readers announce it.
  // Theme: the choice is kept in this browser ("mm-theme", read before the page paints by a one-line script in
  // every page's head); without a choice the site follows the system setting. Animations: see applyMotion above.
  function initSwitches() {
    const slot = document.querySelector(".nav-right");
    if (!slot) return;
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
    slot.insertBefore(box, slot.firstChild);
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
    initHeroFilm();
    initRotator();
    initWelcome();
    markActiveNav();
  });
})();
