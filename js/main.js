/* ==========================================================================
   Compound Equity — shared interactions
   Custom cursor · sticky nav · scroll reveal · counters · magnetic buttons
   ========================================================================== */

(function () {
  "use strict";

  /* ---- Custom cursor ---- */
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

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll("a, button, .card, .plan, .chat-opt, input, textarea, select").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  /* ---- Sticky nav ---- */
  function initNavScroll() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  function initMobileNav() {
    const burger = document.querySelector(".nav-burger");
    const panel = document.querySelector(".mobile-nav");
    const close = document.querySelector(".mobile-close");
    if (!burger || !panel) return;
    const toggle = (open) => panel.classList.toggle("is-open", open);
    burger.addEventListener("click", () => toggle(true));
    close && close.addEventListener("click", () => toggle(false));
    panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---- Scroll reveal ---- */
  function initReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---- Animated counters ---- */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(",", "."));
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = (target * eased).toFixed(decimals);
      el.textContent = prefix + value + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + numStr + suffix;
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    const nums = document.querySelectorAll("[data-counter]");
    if (!nums.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((el) => io.observe(el));
  }

  /* ---- Magnetic buttons ---- */
  function initMagnetic() {
    if (window.matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = "translate(0,0)"));
    });
  }

  /* ---- Hero parallax ---- */
  function initParallax() {
    const layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length) return;
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        layers.forEach((el) => {
          const speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
          el.style.transform = `translateY(${y * speed}px)`;
        });
      },
      { passive: true }
    );
  }

  /* ---- Hero image carousel ---- */
  function initCarousel() {
    const root = document.getElementById("heroCarousel");
    if (!root) return;
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const dots = Array.from(root.querySelectorAll(".carousel-dot"));
    const prevBtn = root.querySelector(".carousel-prev");
    const nextBtn = root.querySelector(".carousel-next");
    let index = 0;
    let timer = null;
    const AUTO_MS = 5000;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
      dots.forEach((d, n) => d.classList.toggle("is-active", n === index));
    }
    function next() { show(index + 1); }
    function prev() { show(index - 1); }
    function start() { stop(); timer = setInterval(next, AUTO_MS); }
    function stop() { if (timer) clearInterval(timer); }

    nextBtn.addEventListener("click", () => { next(); start(); });
    prevBtn.addEventListener("click", () => { prev(); start(); });
    dots.forEach((d) => d.addEventListener("click", () => { show(parseInt(d.dataset.index, 10)); start(); }));
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);

    start();
  }

  /* ---- Active nav link ---- */
  function markActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a, .mobile-nav a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initNavScroll();
    initMobileNav();
    initReveal();
    initCounters();
    initMagnetic();
    initParallax();
    initCarousel();
    markActiveNav();
  });
})();
