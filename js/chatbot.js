/* ==========================================================================
   Compound Equity — front-end simulated advisory questionnaire.
   Educational orientation only — not regulated investment advice.
   No backend: this is a client-side demo. A production build should move
   the scoring/response logic server-side before connecting a real LLM.
   ========================================================================== */

(function () {
  "use strict";

  const QUESTIONS = [
    { id: "q1", textKey: "chat.q1", options: [
      { key: "chat.q1.o1", score: 0 },
      { key: "chat.q1.o2", score: 1 },
      { key: "chat.q1.o3", score: 2 },
      { key: "chat.q1.o4", score: 3 },
    ]},
    { id: "q2", textKey: "chat.q2", options: [
      { key: "chat.q2.o1", score: 0 },
      { key: "chat.q2.o2", score: 2 },
      { key: "chat.q2.o3", score: 3 },
    ]},
    { id: "q3", textKey: "chat.q3", options: [
      { key: "chat.q3.o1", score: 0 },
      { key: "chat.q3.o2", score: 1 },
      { key: "chat.q3.o3", score: 2 },
      { key: "chat.q3.o4", score: 3 },
    ]},
    { id: "q4", textKey: "chat.q4", options: [
      { key: "chat.q4.o1", score: 2 },
      { key: "chat.q4.o2", score: 1 },
      { key: "chat.q4.o3", score: 2 },
      { key: "chat.q4.o4", score: 3 },
    ]},
  ];

  let step = 0;
  let score = 0;
  let busy = false;

  function lang() { return document.documentElement.getAttribute("lang") || "fr"; }

  function els() {
    return {
      body: document.getElementById("chatBody"),
      opts: document.getElementById("chatOptions"),
      restart: document.getElementById("chatRestart"),
    };
  }

  function scrollToBottom() {
    const { body } = els();
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(html, cls) {
    const { body } = els();
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.innerHTML = html;
    body.appendChild(div);
    scrollToBottom();
    return div;
  }

  function addTyping() {
    const { body } = els();
    const div = document.createElement("div");
    div.className = "msg msg-bot";
    div.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    body.appendChild(div);
    scrollToBottom();
    return div;
  }

  function clearOptions() {
    els().opts.innerHTML = "";
  }

  function setBusy(v) { busy = v; }

  function askQuestion(index) {
    const q = QUESTIONS[index];
    clearOptions();
    const typing = addTyping();
    setBusy(true);
    setTimeout(() => {
      typing.remove();
      addMessage(t(q.textKey, lang()), "msg-bot");
      setBusy(false);
      renderOptions(q);
    }, 550 + Math.random() * 300);
  }

  function renderOptions(q) {
    const { opts } = els();
    opts.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "chat-opt";
      btn.type = "button";
      btn.textContent = t(opt.key, lang());
      btn.addEventListener("click", () => handleAnswer(q, opt, btn.textContent));
      opts.appendChild(btn);
    });
  }

  function handleAnswer(q, opt, label) {
    if (busy) return;
    setBusy(true);
    clearOptions();
    addMessage(label, "msg-user");
    score += opt.score;
    step += 1;
    if (step < QUESTIONS.length) {
      setTimeout(() => { setBusy(false); askQuestion(step); }, 250);
    } else {
      setTimeout(showResult, 300);
    }
  }

  function tierFromScore(s) {
    if (s <= 4) return "foundations";
    if (s <= 8) return "compounding";
    return "legacy";
  }

  function showResult() {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMessage(t("chat.analyzing", lang()), "msg-bot");
      const typing2 = addTyping();
      setTimeout(() => {
        typing2.remove();
        const tier = tierFromScore(score);
        const resultHtml =
          '<div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--orange-deep); font-weight:700; margin-bottom:8px;">' +
          t("chat.result.title", lang()) + '</div>' +
          '<div style="font-size:15px; line-height:1.6; color:var(--ink);">' + t("chat.result." + tier, lang()) + '</div>' +
          '<div style="margin-top:16px;"><a href="#plan-' + tier + '" class="btn btn-primary btn-sm">' + t("chat.result.cta", lang()) + '</a></div>' +
          '<div style="margin-top:14px; font-size:12px; color:var(--ink-faint); line-height:1.6;">' + t("chat.result.disclaimer", lang()) + '</div>';
        addMessage(resultHtml, "msg-result");
        document.querySelectorAll(".plan").forEach((p) => p.classList.remove("is-recommended"));
        const rec = document.getElementById("plan-" + tier);
        if (rec) rec.classList.add("is-recommended");
        els().restart.hidden = false;
        setBusy(false);
      }, 900);
    }, 400);
  }

  function startChat() {
    step = 0; score = 0; busy = false;
    const { body, restart } = els();
    body.innerHTML = "";
    restart.hidden = true;
    document.querySelectorAll(".plan").forEach((p) => p.classList.remove("is-recommended"));
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMessage(t("consulting.chat.intro", lang()), "msg-bot");
      setTimeout(() => askQuestion(0), 500);
    }, 500);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("chatBody")) return;
    startChat();
    els().restart.addEventListener("click", startChat);
    document.addEventListener("ce:langchange", () => {
      if (!busy) startChat();
    });
  });
})();
