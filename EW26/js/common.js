// Essay Writing & Exam Preparation Workshop (EW26): activities shared by the student page and the dashboard.
//  1. Preferred outline (slide 8): vote Outline 1 / Outline 2 / another outline (with a suggestion).
//  2. Write an outline (slide 9): free text, shown anonymously on the dashboard.
//  3. A very short introduction (slide 11): which elements would you leave out? (tick any)
//  4. Mark two paragraphs (slides 16 and 17): a mark band from the first-year marking criteria, plus what stands out.
//  5. Plan a 30-minute exam answer (slide 36): free text, shown anonymously on the dashboard.
window.BL = (function () {
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function newId() { return "p" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Dashboard steps. kind: "join" | "open" (phones answer) | "res" (results on screen) | "end".
  // act: which activity the step belongs to.
  const STEPS = [
    { id: "lobby", kind: "join", label: "Join (QR code)" },
    { id: "ov", kind: "open", act: "ov", label: "Slide 8: which outline? (open)" },
    { id: "ovres", kind: "res", act: "ov", label: "Slide 8: which outline? (results)" },
    { id: "ol", kind: "open", act: "ol", label: "Slide 9: write an outline (open, 5 min)" },
    { id: "olres", kind: "res", act: "ol", label: "Slide 9: your outlines" },
    { id: "intro", kind: "open", act: "intro", label: "Slide 11: a very short introduction (open)" },
    { id: "introres", kind: "res", act: "intro", label: "Slide 11: results" },
    { id: "mA", kind: "open", act: "mA", label: "Slide 16: mark paragraph A (open)" },
    { id: "mB", kind: "open", act: "mB", label: "Slide 17: mark paragraph B (open)" },
    { id: "mres", kind: "res", act: "m", label: "Slides 16–17: how did you mark them?" },
    { id: "ep", kind: "open", act: "ep", label: "Slide 36: plan an exam answer (open, 5 min)" },
    { id: "epres", kind: "res", act: "ep", label: "Slide 36: your exam plans" },
    { id: "end", kind: "end", label: "End" }
  ];

  // 1. Outline vote
  const ESSAY_Q = "Critically assess the following statement: ‘Global economic growth cannot be positive forever.’";
  const OUTLINES = {
    o1: { label: "Outline 1", items: ["Introduction", "Economic limits to growth", "Environmental limits to growth", "Do limits to growth really exist?", "Conclusion"] },
    o2: { label: "Outline 2", items: ["Introduction", "Which are the limits to growth?", "A theoretical evaluation of the limits to growth", "An empirical evaluation of the limits to growth", "Conclusion"] },
    other: { label: "Another outline", items: [] }
  };
  const OV_KEYS = ["o1", "o2", "other"];

  // 2. Write an outline
  const OL_Q = "What is the meaning of value in Economics?";
  const OL_MINUTES = 5;
  const OL_MAX = 700;

  // 5. Plan an exam answer (slide 36)
  const EP_Q = "Should governments introduce a minimum wage? Discuss using supply and demand analysis.";
  const EP_MINUTES = 5;

  // Free-text tasks with a timer and a wall of answers on the dashboard.
  const TEXT_TASKS = {
    ol: { q: OL_Q, min: OL_MINUTES, title: "Write an outline", slide: 9, hint: "One section per line, e.g. Introduction, then your main sections, then Conclusion.", ph: "Introduction&#10;…&#10;…&#10;Conclusion" },
    ep: { q: EP_Q, min: EP_MINUTES, title: "Plan a 30-minute exam answer", slide: 36, hint: "Your plan: the main points in order, and how long you would spend on each part.", ph: "Introduction (2 min): …&#10;Diagram: …&#10;…&#10;Conclusion" }
  };

  // 3. Introduction elements (from the video on slide 11)
  const INTRO = [
    { k: "def", t: "Definition of key terms" },
    { k: "res", t: "Reference to research" },
    { k: "pur", t: "Purpose of writing / significance of the topic" },
    { k: "lim", t: "Limitation of discussion" },
    { k: "sum", t: "Summary of main points" }
  ];

  // 4. Marking: bands from the SOAS first-year (Level 4) marking criteria, and a checklist
  const BANDS = [
    { k: "80", t: "80%+" }, { k: "70", t: "70–79%" }, { k: "60", t: "60–69%" },
    { k: "50", t: "50–59%" }, { k: "40", t: "40–49%" }, { k: "0", t: "Below 40% (fail)" }
  ];
  const TICKS = [
    { k: "point", t: "Clear main point", good: true },
    { k: "evid", t: "Good use of evidence and sources", good: true },
    { k: "crit", t: "Critical, not just descriptive", good: true },
    { k: "ref", t: "Accurate referencing", good: true },
    { k: "unsup", t: "Claims not backed by evidence", good: false },
    { k: "vague", t: "Vague or missing sources", good: false },
    { k: "desc", t: "Mostly descriptive", good: false },
    { k: "style", t: "Informal or unclear writing", good: false }
  ];
  const PARAS = {
    mA: { label: "Paragraph A", slide: 16, text: "Some ecological economists have long argued that the enormous growth in productivity of advanced economies was only possible at all because of the abundance of high-quality fossil energy sources (Georgescu-Roegen, 1972; Daly, 1977; Ayres, 2008; Ayres and Warr, 2009). Any slowing down in the availability or quality of such sources might be expected, as the Club of Rome suggested back in 1972, to suppress overall productivity and eventually reduce the rate of industrial output. Both the quality and the availability of resources can be captured in the concept of the energy return on energy invested (EROEI), that is the ratio of the energy delivered to the energy required to find, extract, refine and deliver that energy to the consumer (Rye and Jackson, 2018; Sers and Victor, 2018)." },
    mB: { label: "Paragraph B", slide: 17, text: "One's consumption behavior is strongly influenced by how others consume. But this might be bad for debt accumulation. Some economists have said: ‘The lower income households’ desire to emulate the richer may provide a strong motivation for borrowing to finance their desired consumption’. In the US the household debt as a share of GDP increased from about 45 per cent in 1975 to nearly 100 per cent in 2006. This is due to inequality. Ryoo and Kim (2014) have developed a model that shows that when low-income household emulate the consumption of high-income households, the level of indebtedness increases." }
  };

  // Counting helpers (answers: array of player data objects)
  function count(vals, keys) { const c = {}; keys.forEach((k) => (c[k] = 0)); for (const v of vals) if (v in c) c[v]++; return c; }
  function countMulti(lists, keys) { const c = {}; keys.forEach((k) => (c[k] = 0)); for (const l of lists) for (const v of l || []) if (v in c) c[v]++; return c; }

  return { hash, newId, esc, STEPS, ESSAY_Q, OUTLINES, OV_KEYS, OL_Q, OL_MINUTES, OL_MAX, EP_Q, TEXT_TASKS, INTRO, BANDS, TICKS, PARAS, count, countMulti };
})();
