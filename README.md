# ECN4008 – workshop activities

Live in-class activities for the Year 1 Essay Writing & Exam Preparation Workshop. Students answer on their phones; the lecturer runs each activity from a dashboard on the projector. Same set-up as ECN6019 (plain HTML on GitHub Pages, Firestore for live data).

## Folders

- `shared/` – Firebase settings, dashboard passcode and module name (`config.js`), styles, data code and libraries. Uses the same Firebase project as ECN6019, so nothing new to set up.
- `EW26/` – the 2026/27 workshop. Data key `sessions/EW26`.
  - Students: `https://angelosdecon.github.io/ECN4008/EW26/`
  - Dashboard: `https://angelosdecon.github.io/ECN4008/EW26/dashboard.html` (passcode in `shared/config.js`)
- `index.html` – landing page. `firestore.rules` – the same rules as ECN6019 (already published in Firebase).

## One-time setup

GitHub: create a public repository `ECN4008`, upload the contents of this folder, then Settings → Pages → Deploy from a branch → `main` / `(root)` → Save. The Firebase project is shared with ECN6019, so `config.js` is already filled in.

## In class

Open the dashboard, show the QR (step 1), then Next/Back or the arrow keys. Phones follow the dashboard; if a phone is locked or the student switches app, the page reloads itself when they come back, and there is a ↻ button at the top. **New session** makes every phone re-join and leaves earlier answers out of the results.

Test first with `?demo=1` (e.g. `…/EW26/dashboard.html?demo=1` and `…/EW26/?demo=1` in tabs of the same browser); the dashboard then has "+ 16 simulated students".

See `EW26/README.md` for the activities.
