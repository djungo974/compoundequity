/* ==========================================================================
   Compound Equity — front-end simulated advisory questionnaire.
   Educational orientation only — not regulated investment advice.
   No backend: this is a client-side demo. A production build should move
   the scoring/response logic server-side before connecting a real LLM.
   ========================================================================== */

(function () {
  "use strict";

  const QUESTIONS = [
    { text: "To start, what's your investment horizon?", options: [
      { label: "Less than 2 years", score: 0 },
      { label: "2 to 5 years", score: 1 },
      { label: "5 to 10 years", score: 2 },
      { label: "More than 10 years", score: 3 },
    ]},
    { text: "How would you react to a 20% drop in your portfolio?", options: [
      { label: "I'd sell to limit losses", score: 0 },
      { label: "I'd wait it out", score: 2 },
      { label: "I'd invest more", score: 3 },
    ]},
    { text: "How much capital are you considering investing?", options: [
      { label: "Under $10,000", score: 0 },
      { label: "$10,000 – $50,000", score: 1 },
      { label: "$50,000 – $250,000", score: 2 },
      { label: "Over $250,000", score: 3 },
    ]},
    { text: "What's your main goal?", options: [
      { label: "Grow my capital long-term", score: 2 },
      { label: "Generate extra income", score: 1 },
      { label: "Prepare for retirement", score: 2 },
      { label: "Diversify existing wealth", score: 3 },
    ]},
  ];

  const RESULTS = {
    foundations: "Your profile matches a cautious, progressive approach. We recommend the <strong>Foundations</strong> plan — ideal for starting with method.",
    compounding: "Your profile shows a good balance of patience and ambition. We recommend the <strong>Compounding</strong> plan — our most complete day-to-day guidance.",
    legacy: "Your profile shows a long horizon and high risk tolerance. We recommend the <strong>Legacy</strong> plan — full wealth-advisory support.",
  };

  let step = 0;
  let score = 0;
  let busy = false;

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
      addMessage(q.text, "msg-bot");
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
      btn.textContent = opt.label;
      btn.addEventListener("click", () => handleAnswer(q, opt));
      opts.appendChild(btn);
    });
  }

  function handleAnswer(q, opt) {
    if (busy) return;
    setBusy(true);
    clearOptions();
    addMessage(opt.label, "msg-user");
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
      addMessage("Thank you. Cross-referencing your answers with our conviction grid…", "msg-bot");
      const typing2 = addTyping();
      setTimeout(() => {
        typing2.remove();
        const tier = tierFromScore(score);
        const resultHtml =
          '<div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--orange-deep); font-weight:700; margin-bottom:8px;">Suggested orientation</div>' +
          '<div style="font-size:15px; line-height:1.6; color:var(--ink);">' + RESULTS[tier] + '</div>' +
          '<div style="margin-top:16px;"><a href="#plan-' + tier + '" class="btn btn-primary btn-sm">See the recommended plan</a></div>' +
          '<div style="margin-top:14px; font-size:12px; color:var(--ink-faint); line-height:1.6;">This orientation is generated automatically from your answers, for informational and educational purposes only. It does not constitute regulated, personalized investment advice.</div>';
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
      addMessage("Hi, I'm the Compound Equity assistant. I'll ask you a few questions to understand your investor profile — it takes less than two minutes.", "msg-bot");
      setTimeout(() => askQuestion(0), 500);
    }, 500);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("chatBody")) return;
    startChat();
    els().restart.addEventListener("click", startChat);
  });
})();
