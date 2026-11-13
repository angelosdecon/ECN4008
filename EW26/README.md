# EW26: workshop activities (2026/27)

Dashboard steps (Next/Back, arrow keys or the step menu):

1. **Join** – QR code and count of phones. Every later step also shows a small QR in the corner for latecomers.
2. **Slide 8: which outline? (open)** – Outline 1, Outline 2, or "another outline" with a box to type it.
3. **Results** – bar chart (%), and the suggested outlines.
4. **Slide 9: write an outline (open)** – "What is the meaning of value in Economics?" Free text, one section per line. A 5-minute timer runs on the dashboard from when the step is first opened.
5. **Your outlines** – anonymous wall of outlines. Click one to enlarge it (Previous/Next to browse, Esc to close); × or "Hide this one" removes an outline from the screen.
6. **Slide 11: a very short introduction (open)** – tick the elements you would leave out, or "keep all of them".
7. **Results** – % who would leave out each element.
8. **Slide 16: mark paragraph A (open)** and 9. **Slide 17: mark paragraph B (open)** – a mark band from the first-year marking criteria (80%+ … below 40%) and ticks for strengths and weaknesses. The paragraph text is on the dashboard and, folded, on the phones.
10. **How did you mark them?** – mark distribution for A vs B, and what stood out.
11. **Slide 36: plan a 30-minute exam answer (open)** – "Should governments introduce a minimum wage?" Free text, 5-minute timer.
12. **Your exam plans** – anonymous wall, same controls as the outlines.
13. **End.**

Answers can be changed while a question is open. On results steps the phones say "Look up at the screen" and show the student's own answer.

Data: `sessions/EW26/pl/<id>` = {lobby, joinedAt, a: {ov, ovText, ol, intro[], introDone, mA: {b, t[]}, mB: {b, t[]}, ep}}. Session document: {lobby, step, phase, opened: {stepId: time}, hidden: {cardId: true}}.

To change the wording of any activity, edit `js/common.js`.
