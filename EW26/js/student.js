// EW26 student page. The phone follows the dashboard's current step (state.phase).
// Answers are saved as you tap and can be changed while a question is open.
(function () {
  const S = window.Store, B = window.BL, cfg = window.BIASLAB_CONFIG || {};
  const view = document.getElementById("view");
  const esc = B.esc;
  document.getElementById("modname").textContent = (cfg.moduleName || "") + (S.demo ? " · demo mode" : "");
  document.getElementById("refresh").onclick = () => location.reload();

  const idStore = S.demo ? sessionStorage : localStorage;
  const ID_KEY = "ecn-pid-" + S.root;
  let pid = idStore.getItem(ID_KEY);
  if (!pid) { pid = B.newId(); idStore.setItem(ID_KEY, pid); }

  // Coming back to the page after the phone was locked or another app was used: reload, so it is up to date.
  let hiddenAt = null;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 3000) location.reload();
    hiddenAt = null;
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });

  const st = { state: null, mine: undefined };
  const ui = { draft: {}, dirty: {} };
  S.onDoc("", (d) => { st.state = d; register(); render(); });
  S.onDoc("pl/" + pid, (d) => { st.mine = d; register(); render(); });

  const lobby = () => st.state && st.state.lobby;
  const phase = () => (st.state && st.state.phase) || "lobby";
  const mine = () => (st.mine && st.mine.lobby === lobby() ? st.mine : null);
  const ans = () => (mine() && mine().a) || {};

  function register() {
    if (!lobby() || st.mine === undefined) return;
    if (mine() || register.pending === lobby()) return;
    register.pending = lobby();
    S.setDoc("pl/" + pid, { lobby: lobby(), joinedAt: Date.now(), a: {} });
  }
  const save = (fields) => {
    const f = { lobby: lobby() };
    for (const [k, v] of Object.entries(fields)) f["a." + k] = v;
    return S.updateDoc("pl/" + pid, f);
  };
  const savedNote = (ok, txt) => `<p class="center small ${ok ? "okt" : "muted"}">${ok ? "✓ " + (txt || "Saved. You can change it while the question is open.") : "Not answered yet"}</p>`;

  let lastSig = "";
  function render() {
    const ph = phase(), a = ans();
    const step = B.STEPS.find((s) => s.id === ph) || B.STEPS[0];
    let sig, html;
    if (!lobby()) { sig = "wait"; html = `<h2>Welcome</h2><div class="rule"></div><p>Waiting for the session to open…</p>`; }
    else if (step.kind === "join") {
      sig = "lobby" + lobby();
      html = `<h2>You're in</h2><div class="rule"></div><p><b>Keep this page open</b> during the workshop. When we get to an activity, it appears here by itself.</p>
        <div class="card soft small">No names and no logins: your answers are anonymous. If the page looks stuck, tap <b>↻</b> at the top.</div>`;
    }
    else if (step.kind === "end") { sig = "end"; html = `<h2>Thank you</h2><div class="rule"></div><p>That's all the activities for today. You can close this page.</p>`; }
    else if (step.kind === "res") { sig = "res" + ph; html = `<h2>Look up at the screen</h2><div class="rule"></div><p>We're looking at the class's answers together.</p>${myRecap(step.act, a)}`; }
    else if (ph === "ov") {
      sig = "ov|" + a.ov + "|" + (a.ovText || "");
      if (!ui.dirty.ov) ui.draft.ov = a.ovText || "";
      html = `<div class="small muted">Slide 8</div><h2 style="margin-top:4px">Which outline would you prefer?</h2><div class="rule"></div>
        <p class="small"><i>${esc(B.ESSAY_Q)}</i></p>
        ${["o1", "o2"].map((k) => `<button class="opt ${a.ov === k ? "chosen" : ""}" data-ov="${k}"><b>${B.OUTLINES[k].label}</b><ol>${B.OUTLINES[k].items.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></button>`).join("")}
        <button class="opt ${a.ov === "other" ? "chosen" : ""}" data-ov="other"><b>Another outline</b> <span class="muted small">(suggest one below)</span></button>
        ${a.ov === "other" ? `<textarea id="ovText" rows="5" maxlength="${B.OL_MAX}" placeholder="Your outline: one section per line">${esc(ui.draft.ov)}</textarea>
          <button class="primary full" id="ovSend">${a.ovText ? "Update my outline" : "Send my outline"}</button>` : ""}
        ${savedNote(!!a.ov)}`;
    }
    else if (ph === "ol" || ph === "ep") {
      const T = B.TEXT_TASKS[ph], v = a[ph] || "";
      sig = ph + "|" + v;
      if (!ui.dirty[ph]) ui.draft[ph] = v;
      html = `<div class="small muted">Slide ${T.slide} · ${T.min} minutes</div><h2 style="margin-top:4px">${T.title}</h2><div class="rule"></div>
        <p><b>${esc(T.q)}</b></p>
        <p class="small muted">${T.hint} Shown anonymously on the screen.</p>
        <textarea id="txt" rows="9" maxlength="${B.OL_MAX}" placeholder="${T.ph}">${esc(ui.draft[ph])}</textarea>
        <button class="primary full big" id="txtSend">${v ? "Update and send again" : "Send"}</button>
        ${savedNote(!!v, "Sent. You can edit and send again while this is open.")}`;
    }
    else if (ph === "intro") {
      const sel = a.intro || [];
      sig = "intro|" + sel.join(",") + "|" + (a.introDone ? 1 : 0);
      html = `<div class="small muted">Slide 11</div><h2 style="margin-top:4px">A very short essay</h2><div class="rule"></div>
        <p>You need to write a <b>very short</b> essay. Which of these elements would you <b>leave out</b> of the introduction? Tick any.</p>
        ${B.INTRO.map((x) => `<button class="opt tick ${sel.includes(x.k) ? "chosen" : ""}" data-intro="${x.k}">${sel.includes(x.k) ? "☑" : "☐"} ${esc(x.t)}</button>`).join("")}
        <button class="opt tick ${a.introDone && !sel.length ? "chosen" : ""}" data-intro="none">${a.introDone && !sel.length ? "☑" : "☐"} I'd keep all of them</button>
        ${savedNote(!!a.introDone)}`;
    }
    else if (ph === "mA" || ph === "mB") {
      const P = B.PARAS[ph], m = a[ph] || {}, t = m.t || [];
      sig = ph + "|" + m.b + "|" + t.join(",");
      html = `<div class="small muted">Slide ${P.slide}</div><h2 style="margin-top:4px">How would you mark ${P.label}?</h2><div class="rule"></div>
        <details class="card small"><summary><b>Read the paragraph</b></summary><p>${esc(P.text)}</p></details>
        <h3>1. Your mark</h3>
        <div class="bands">${B.BANDS.map((x) => `<button class="${m.b === x.k ? "chosen" : ""}" data-band="${x.k}">${esc(x.t)}</button>`).join("")}</div>
        <h3 style="margin-top:16px">2. What stands out? <span class="small muted">(tick any)</span></h3>
        <div class="small muted" style="margin:6px 0 2px">Strengths</div>
        ${B.TICKS.filter((x) => x.good).map((x) => tickBtn(x, t)).join("")}
        <div class="small muted" style="margin:10px 0 2px">Weaknesses</div>
        ${B.TICKS.filter((x) => !x.good).map((x) => tickBtn(x, t)).join("")}
        ${savedNote(!!m.b)}`;
    }
    else { sig = "other" + ph; html = `<h2>Look up at the screen</h2><div class="rule"></div>`; }
    if (sig === lastSig) return;
    lastSig = sig; view.innerHTML = html; wire();
  }
  const tickBtn = (x, t) => `<button class="opt tick ${t.includes(x.k) ? "chosen" : ""}" data-tick="${x.k}">${t.includes(x.k) ? "☑" : "☐"} ${esc(x.t)}</button>`;

  // A short reminder of the student's own answer on the results screens.
  function myRecap(act, a) {
    let r = "";
    if (act === "ov" && a.ov) r = "You chose <b>" + B.OUTLINES[a.ov].label + "</b>.";
    if (act === "ol" && a.ol) r = "Your outline:<br>" + esc(a.ol).replace(/\n/g, "<br>");
    if (act === "ep" && a.ep) r = "Your plan:<br>" + esc(a.ep).replace(/\n/g, "<br>");
    if (act === "intro" && a.introDone) r = (a.intro && a.intro.length) ? "You'd leave out: " + a.intro.map((k) => B.INTRO.find((x) => x.k === k).t).join("; ") + "." : "You'd keep all of them.";
    if (act === "m") {
      const lab = (k) => { const b = a[k] && a[k].b; return b ? B.BANDS.find((x) => x.k === b).t : "–"; };
      if ((a.mA && a.mA.b) || (a.mB && a.mB.b)) r = `Your marks: paragraph A <b>${lab("mA")}</b>, paragraph B <b>${lab("mB")}</b>.`;
    }
    return r ? `<div class="card soft small">${r}</div>` : "";
  }

  function wire() {
    const ph = phase(), a = ans();
    const guard = (fn) => async (...x) => { if (phase() !== ph) return; await fn(...x); };
    view.querySelectorAll("[data-ov]").forEach((b) => (b.onclick = guard(() => save({ ov: b.dataset.ov }))));
    const ovT = document.getElementById("ovText");
    if (ovT) { ovT.oninput = () => { ui.draft.ov = ovT.value; ui.dirty.ov = true; }; }
    const ovS = document.getElementById("ovSend");
    if (ovS) ovS.onclick = guard(async () => { ui.dirty.ov = false; await save({ ovText: (ui.draft.ov || "").trim().slice(0, B.OL_MAX) }); });
    const tT = document.getElementById("txt");
    if (tT) tT.oninput = () => { ui.draft[ph] = tT.value; ui.dirty[ph] = true; };
    const tS = document.getElementById("txtSend");
    if (tS) tS.onclick = guard(async () => { const v = (ui.draft[ph] || "").trim().slice(0, B.OL_MAX); if (!v) return; ui.dirty[ph] = false; await save({ [ph]: v }); });
    view.querySelectorAll("[data-intro]").forEach((b) => (b.onclick = guard(() => {
      const k = b.dataset.intro;
      if (k === "none") return save({ intro: [], introDone: true });
      const cur = new Set(a.intro || []); cur.has(k) ? cur.delete(k) : cur.add(k);
      return save({ intro: B.INTRO.map((x) => x.k).filter((x) => cur.has(x)), introDone: true });
    })));
    view.querySelectorAll("[data-band]").forEach((b) => (b.onclick = guard(() => save({ [ph + ".b"]: b.dataset.band }))));
    view.querySelectorAll("[data-tick]").forEach((b) => (b.onclick = guard(() => {
      const cur = new Set((a[ph] && a[ph].t) || []); const k = b.dataset.tick; cur.has(k) ? cur.delete(k) : cur.add(k);
      return save({ [ph + ".t"]: B.TICKS.map((x) => x.k).filter((x) => cur.has(x)) });
    })));
  }
})();
