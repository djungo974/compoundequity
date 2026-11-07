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

  function initCursor() {
    if (window.matchMedia("(hover: none)").matches) return;
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, summary, input, .card, .plan").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
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
    initWelcome();
    markActiveNav();
  });
})();
