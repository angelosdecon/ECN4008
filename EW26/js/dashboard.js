// EW26 dashboard: steps for slides 8, 9, 11, 16 and 17 of the workshop.
(function () {
  const S = window.Store, B = window.BL, cfg = window.BIASLAB_CONFIG || {};
  const stage = document.getElementById("stage");
  const $ = (id) => document.getElementById(id);
  const esc = B.esc;
  $("modname").textContent = cfg.moduleName || "";
  if (S.demo) { $("demoflag").innerHTML = '<span class="demo-flag">DEMO MODE – this computer only</span>'; $("bots").classList.remove("hidden"); }

  // ---------- passcode gate ----------
  const GATE = "ecn-ok-" + S.root;
  if (cfg.passcode && sessionStorage.getItem(GATE) !== "1") {
    document.querySelector("main").innerHTML = `<div class="gate"><h2>Dashboard</h2><div class="rule" style="margin:8px auto 14px"></div>
      <p class="muted">Enter the passcode.</p><input id="pc" type="password" autofocus><button class="primary full" id="go">Open</button>
      <p class="small muted">Students: you need <a href="index.html">the student page</a>.</p></div>`;
    $("controls").style.display = "none";
    const go = () => { if ($("pc").value === cfg.passcode) { sessionStorage.setItem(GATE, "1"); location.reload(); } else $("pc").value = ""; };
    $("go").onclick = go; $("pc").onkeydown = (e) => { if (e.key === "Enter") go(); };
    return;
  }

  const STEPS = B.STEPS;
  $("steps").innerHTML = STEPS.map((s, i) => `<option value="${i}">${i + 1}. ${s.label}</option>`).join("");

  const D = { state: null, pl: [] };
  let charts = {}, mountedKey = null, zoomId = null;
  S.onDoc("", (d) => { D.state = d; if (!d || !d.lobby) initSession(); render(); });
  S.onCol("pl", (a) => { D.pl = a; render(); });

  const lobby = () => (D.state && D.state.lobby) || null;
  const here = () => D.pl.filter((a) => a.data.lobby === lobby());
  const A = () => here().map((x) => ({ id: x.id, a: x.data.a || {} }));
  const hidden = () => (D.state && D.state.hidden) || {};
  const pct = (x, n) => (n ? Math.round((100 * x) / n) : 0);
  const curStep = () => (D.state && D.state.step) || 0;

  async function initSession() {
    if (initSession.done) return; initSession.done = true;
    const cur = await S.getDoc("");
    if (!cur || !cur.lobby) await S.setDoc("", { lobby: "L" + Date.now().toString(36), step: 0, phase: "lobby", phaseId: "init", hidden: {} });
  }
  $("next").onclick = () => goTo(curStep() + 1);
  $("back").onclick = () => goTo(curStep() - 1);
  $("steps").onchange = (e) => goTo(Number(e.target.value));
  $("newSession").onclick = async () => {
    if (!confirm("Start a new session? Everyone's phone re-joins automatically; earlier answers are kept out of the results.")) return;
    await S.setDoc("", { lobby: "L" + Date.now().toString(36), step: 0, phase: "lobby", phaseId: "p" + Date.now(), hidden: {} });
  };
  $("bots").onclick = addBots;
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "Escape" && zoomId) { zoomId = null; drawWall(true); return; }
    if (e.key === "ArrowRight" || e.key === "PageDown") goTo(curStep() + 1);
    if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(curStep() - 1);
  });
  async function goTo(i) {
    if (i < 0 || i >= STEPS.length || !D.state) return;
    zoomId = null;
    const opened = Object.assign({}, D.state.opened || {});
    if (STEPS[i].kind === "open" && !opened[STEPS[i].id]) opened[STEPS[i].id] = Date.now();
    await S.setDoc("", { lobby: lobby(), step: i, phase: STEPS[i].id, phaseId: "p" + Date.now(), hidden: hidden(), opened });
  }
  async function hide(id) { await S.updateDoc("", { ["hidden." + id]: true }); }

  // ---------- charts ----------
  const BLUE = "#3333b3", ORANGE = "#e8833a", GREY = "#cfcfcf";
  Chart.defaults.font.family = '"Helvetica Neue", Arial, sans-serif'; Chart.defaults.font.size = 18; Chart.defaults.color = "#333";
  function chart(id, config) { if (!$(id)) return; if (charts[id]) { charts[id].data = config.data; charts[id].update("none"); return; } charts[id] = new Chart($(id), config); }
  const pctAxis = { min: 0, max: 100, ticks: { callback: (v) => v + "%" } };
  function set(id, v) { const el = $(id); if (el && el.innerHTML !== String(v)) el.innerHTML = v; }
  function studentURL() { return location.href.replace(/dashboard\.html.*$/, "").replace(/[?#].*$/, ""); }
  function qrSvg(url, cell) { const q = qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true }); }

  // ---------- render ----------
  function render() {
    if (!D.state) return;
    const st = STEPS[curStep()], key = st.id + lobby();
    $("steps").value = curStep(); $("joined").textContent = here().length + " joined";
    if (mountedKey !== key) { mountedKey = key; mount(st); }
    update(st);
  }
  const kpi = (id, label) => `<div class="kpi"><div class="v" id="${id}">0</div><div class="l">${label}</div></div>`;
  const corner = () => `<div class="corner"><div class="miniqr" id="miniqr"></div><div class="small muted">Not joined yet?<br>Scan to join</div></div>`;

  function mount(st) {
    for (const k of Object.keys(charts)) { charts[k].destroy(); delete charts[k]; }
    let h = "";
    if (st.id === "lobby") h = `<h1>Join on your phone</h1><div class="rule"></div>
      <div class="qrwrap" style="flex-wrap:nowrap"><div class="qr" id="qr"></div><div style="flex:1;min-width:0">
        <p class="lead">Scan the code with your phone camera, or go to</p><p class="url" id="url"></p>
        <div class="kpis">${kpi("k-joined", "phones joined")}</div>
        <p class="lead muted">Keep the page open: each activity appears on your phone when we get to it. Anonymous, no logins.</p></div></div>`;
    if (st.id === "ov") h = `<h1>Which outline would you prefer?</h1><div class="rule"></div>
      <p class="lead"><i>${esc(B.ESSAY_Q)}</i></p>
      <div class="cols">${["o1", "o2"].map((k) => `<div class="card"><h3>${B.OUTLINES[k].label}</h3><ol class="biglist">${B.OUTLINES[k].items.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>`).join("")}</div>
      <p class="lead">…or suggest <b>another outline</b> on your phone.</p>
      <div class="kpis">${kpi("k-ans", "answered")}${kpi("k-j", "phones joined")}</div>`;
    if (st.id === "ovres") h = `<h1>Which outline would you prefer?</h1><div class="rule"></div>
      <div class="cols"><div><div class="chartbox"><canvas id="c-ov"></canvas></div><p class="muted" id="ov-n"></p></div>
      <div><h3>Other outlines you suggested</h3><div id="ov-wall" class="wall one"></div></div></div>`;
    if (st.id === "ol" || st.id === "ep") { const T = B.TEXT_TASKS[st.id];
      h = `<h1>Take ${T.min} minutes: ${T.title.toLowerCase()}</h1><div class="rule"></div>
      <p class="lead" style="font-size:30px"><b>${esc(T.q)}</b></p>
      <div class="kpis"><div class="kpi"><div class="v timer" id="k-timer">${T.min}:00</div><div class="l">time left</div></div>${kpi("k-ans", "sent")}${kpi("k-j", "phones joined")}</div>`; }
    if (st.id === "olres" || st.id === "epres") { const T = B.TEXT_TASKS[st.act];
      h = `<h1>${st.id === "olres" ? "Your outlines" : "Your exam plans"}: <span class="muted" style="font-weight:400">${esc(T.q)}</span></h1><div class="rule"></div>
      <p class="muted">Click one to enlarge it (Esc to close). × hides it from the screen.</p><div id="ol-wall" class="wall"></div>`; }
    if (st.id === "intro") h = `<h1>A very short essay: what would you leave out?</h1><div class="rule"></div>
      <p class="lead">Typical elements of an introduction. Which would you <b>exclude</b> from a very short essay?</p>
      <ol class="biglist">${B.INTRO.map((x) => `<li>${esc(x.t)}</li>`).join("")}</ol>
      <div class="kpis">${kpi("k-ans", "answered")}${kpi("k-j", "phones joined")}</div>`;
    if (st.id === "introres") h = `<h1>What would you leave out of a very short introduction?</h1><div class="rule"></div>
      <div class="chartbox tall"><canvas id="c-intro"></canvas></div><p class="muted" id="intro-n"></p>`;
    if (st.id === "mA" || st.id === "mB") { const P = B.PARAS[st.id];
      h = `<h1>How would you mark ${P.label}?</h1><div class="rule"></div>
      <div class="card para">${esc(P.text)}</div>
      <p class="lead">On your phone: pick a mark band, then tick what stands out.</p>
      <div class="kpis">${kpi("k-ans", "marked")}${kpi("k-j", "phones joined")}</div>`; }
    if (st.id === "mres") h = `<h1>How did you mark the two paragraphs?</h1><div class="rule"></div>
      <div class="cols"><div><h3>Marks given</h3><div class="chartbox"><canvas id="c-marks"></canvas></div><p class="muted" id="m-n"></p></div>
      <div><h3>What stood out (% of markers)</h3><div class="chartbox tall"><canvas id="c-ticks"></canvas></div></div></div>`;
    if (st.id === "end") h = `<h1>Thank you</h1><div class="rule"></div><p class="lead">Thanks for taking part. You can close the page on your phone.</p>`;
    if (st.kind !== "join" && st.kind !== "end") h += corner();
    stage.innerHTML = h;
    const url = studentURL();
    if (st.id === "lobby") { set("url", url.replace(/^https?:\/\//, "")); $("qr").innerHTML = qrSvg(url, 8); }
    if ($("miniqr")) $("miniqr").innerHTML = qrSvg(url, 3);
  }

  function update(st) {
    const all = A(), n = here().length;
    set("k-joined", n); set("k-j", n);
    if (st.id === "ov") set("k-ans", all.filter((x) => x.a.ov).length);
    if (st.id === "ol" || st.id === "ep") {
      set("k-ans", all.filter((x) => x.a[st.id]).length);
      tick();
    }
    if (st.id === "intro") set("k-ans", all.filter((x) => x.a.introDone).length);
    if (st.id === "mA" || st.id === "mB") set("k-ans", all.filter((x) => x.a[st.id] && x.a[st.id].b).length);

    if (st.id === "ovres") {
      const v = all.map((x) => x.a.ov).filter(Boolean), c = B.count(v, B.OV_KEYS);
      chart("c-ov", { type: "bar", data: { labels: B.OV_KEYS.map((k) => B.OUTLINES[k].label), datasets: [{ data: B.OV_KEYS.map((k) => pct(c[k], v.length)), backgroundColor: [BLUE, ORANGE, GREY] }] },
        options: { maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (t) => t.raw + "% (" + c[B.OV_KEYS[t.dataIndex]] + ")" } } }, scales: { y: pctAxis } } });
      set("ov-n", v.length + " answers");
      drawCards("ov-wall", all.filter((x) => x.a.ov === "other" && x.a.ovText && !hidden()[x.id + "-ov"]).map((x) => ({ id: x.id + "-ov", text: x.a.ovText })));
    }
    if (st.id === "olres" || st.id === "epres") drawWall();
    if (st.id === "introres") {
      const done = all.filter((x) => x.a.introDone), c = B.countMulti(done.map((x) => x.a.intro), B.INTRO.map((x) => x.k));
      chart("c-intro", { type: "bar", data: { labels: B.INTRO.map((x) => x.t), datasets: [{ data: B.INTRO.map((x) => pct(c[x.k], done.length)), backgroundColor: BLUE }] },
        options: { indexAxis: "y", maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: pctAxis } } });
      const keepAll = done.filter((x) => !(x.a.intro || []).length).length;
      set("intro-n", `${done.length} answers · ${keepAll} would keep all of them`);
    }
    if (st.id === "mres") {
      const sets = ["mA", "mB"].map((k) => all.map((x) => x.a[k]).filter((m) => m && m.b));
      const bk = B.BANDS.map((x) => x.k);
      chart("c-marks", { type: "bar", data: { labels: B.BANDS.map((x) => x.t), datasets: sets.map((s, i) => { const c = B.count(s.map((m) => m.b), bk); return { label: ["Paragraph A", "Paragraph B"][i], data: bk.map((k) => pct(c[k], s.length)), backgroundColor: i ? ORANGE : BLUE }; }) },
        options: { maintainAspectRatio: false, animation: false, plugins: { legend: { display: true } }, scales: { y: { min: 0, ticks: { callback: (v) => v + "%" } } } } });
      const tk = B.TICKS.map((x) => x.k);
      chart("c-ticks", { type: "bar", data: { labels: B.TICKS.map((x) => (x.good ? "✓ " : "✗ ") + x.t), datasets: sets.map((s, i) => { const c = B.countMulti(s.map((m) => m.t), tk); return { label: ["Paragraph A", "Paragraph B"][i], data: tk.map((k) => pct(c[k], s.length)), backgroundColor: i ? ORANGE : BLUE }; }) },
        options: { indexAxis: "y", maintainAspectRatio: false, animation: false, layout: { padding: { left: 12 } }, plugins: { legend: { display: true } }, scales: { x: pctAxis } } });
      set("m-n", `Paragraph A: ${sets[0].length} marks · Paragraph B: ${sets[1].length} marks`);
    }
  }

  // ---------- timer for the outline task ----------
  let timerOn = null;
  function tick() {
    const sid = STEPS[curStep()].id, T = B.TEXT_TASKS[sid];
    const t0 = T && D.state.opened && D.state.opened[sid];
    if (!t0 || !$("k-timer")) return;
    const left = Math.max(0, T.min * 60 - Math.floor((Date.now() - t0) / 1000));
    set("k-timer", Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"));
    $("k-timer").classList.toggle("out", left === 0);
    if (!timerOn) timerOn = setInterval(() => { if (B.TEXT_TASKS[STEPS[curStep()].id]) tick(); else { clearInterval(timerOn); timerOn = null; } }, 1000);
  }

  // ---------- outline walls ----------
  function drawCards(elId, items) {
    const el = $(elId); if (!el) return;
    const sig = JSON.stringify(items.map((x) => x.id + x.text.length));
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    el.innerHTML = items.length ? items.map((x) => `<div class="olcard" data-id="${x.id}"><button class="x" data-hide="${x.id}" title="Hide from screen">×</button>${esc(x.text).replace(/\n/g, "<br>")}</div>`).join("") : `<p class="muted">None yet.</p>`;
    el.querySelectorAll("[data-hide]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); hide(b.dataset.hide); }));
    el.querySelectorAll(".olcard").forEach((c) => (c.onclick = () => { if (elId === "ol-wall") { zoomId = c.dataset.id; drawWall(true); } }));
  }
  function drawWall(force) {
    const el = $("ol-wall"); if (!el) return;
    const k = STEPS[curStep()].act;
    const items = A().filter((x) => x.a[k] && !hidden()[x.id + "-" + k]).sort((p, q) => p.id < q.id ? -1 : 1).map((x) => ({ id: x.id + "-" + k, text: x.a[k] }));
    if (zoomId) {
      const it = items.find((x) => x.id === zoomId);
      if (!it) { zoomId = null; } else {
        const i = items.indexOf(it);
        const sig = "z" + zoomId + it.text.length; if (!force && el.dataset.sig === sig) return; el.dataset.sig = sig;
        el.className = "wall zoomed";
        el.innerHTML = `<div class="olcard big">${esc(it.text).replace(/\n/g, "<br>")}</div>
          <div class="zoomnav"><button id="zp">◀ Previous</button><span class="muted">${i + 1} of ${items.length}</span><button id="zn">Next ▶</button><button id="zc">Close (Esc)</button><button id="zh">Hide this one</button></div>`;
        $("zp").onclick = () => { zoomId = items[(i - 1 + items.length) % items.length].id; drawWall(true); };
        $("zn").onclick = () => { zoomId = items[(i + 1) % items.length].id; drawWall(true); };
        $("zc").onclick = () => { zoomId = null; drawWall(true); };
        $("zh").onclick = () => { hide(zoomId); zoomId = items.length > 1 ? items[(i + 1) % items.length].id : null; drawWall(true); };
        return;
      }
    }
    el.className = "wall";
    if (force) el.dataset.sig = "";
    drawCards("ol-wall", items);
  }

  // ---------- demo: simulated students ----------
  const SAMPLE_OL = ["Introduction\nValue in classical economics (labour theory)\nValue in neoclassical economics (utility, prices)\nComparing the two views\nConclusion",
    "Intro: defining value\nUse value vs exchange value\nMarginal utility and price\nCritiques\nConclusion",
    "Introduction\nWhat do we mean by value?\nTheories of value: Smith, Ricardo, Marx\nThe marginalist revolution\nConclusion",
    "Introduction\nValue = price?\nSubjective value\nValue and markets\nConclusion"];
  async function addBots() {
    const items = [], pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const some = (keys, p) => keys.filter(() => Math.random() < p);
    for (let k = 0; k < 16; k++) {
      const id = "bot" + Math.random().toString(36).slice(2, 8);
      const a = {
        ov: pick(["o1", "o1", "o2", "o2", "o2", "other"]),
        ol: pick(SAMPLE_OL),
        intro: some(["def", "res", "pur", "lim", "sum"], 0.35), introDone: true,
        mA: { b: pick(["80", "70", "70", "60", "60", "50"]), t: some(["point", "evid", "crit", "ref", "desc"], 0.5) },
        mB: { b: pick(["60", "50", "50", "40", "40", "0"]), t: some(["point", "unsup", "vague", "desc", "style"], 0.5) },
        ep: pick(["Intro + define minimum wage (3 min)\nDiagram: price floor above equilibrium, unemployment (10 min)\nCounter: monopsony case (10 min)\nConclusion (5 min)\nCheck (2 min)",
          "Plan 3 min\nCompetitive labour market diagram\nEvidence: Card and Krueger\nOverall judgement\nCheck answers"])
      };
      if (a.ov === "other") a.ovText = "Introduction\nWhat is growth?\nArguments for limits\nArguments against\nConclusion";
      items.push(["pl/" + id, { lobby: lobby(), joinedAt: Date.now(), a }]);
    }
    await S.batchSet(items);
  }
})();
