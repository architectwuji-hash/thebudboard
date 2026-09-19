# TheBudBoard — Browser Tycoon / Tower Defense (foundation)

Vite + vanilla JavaScript + HTML Canvas 2D. Static build deploys to **thebudboard.com** via Cloudflare Pages.

## Project layout

```
thebudboard/
├── frontend/          Vite game (site root for Pages)
│   ├── src/
│   │   ├── config.js  All stats and colors
│   │   ├── logic.js   Game state updates (no drawing)
│   │   ├── render.js  All canvas drawing
│   │   ├── input.js   Keyboard + touch joystick
│   │   └── main.js    Loop, resize, bootstrap
│   └── index.html
├── scraper/           Legacy Python scraper (unchanged in git history)
└── supabase/          Legacy SQL (unchanged in git history)
```

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

**Controls:** WASD / arrow keys on desktop; touch the **left half** of the screen on mobile for a virtual joystick.

## Deploy (Cloudflare Pages → thebudboard.com)

Keep your existing Pages project and custom domain. Update **build settings** if they still target Next.js:

| Setting | Value |
|---------|--------|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `.next` |
| Framework preset | Vite (or None) |

Environment variables from the old deals site are no longer required for the game.

Push to the branch Cloudflare watches (usually `main`) to trigger a deploy.

## Architecture rules

1. **Logic never draws** — `logic.js` only mutates state.
2. **All drawing in `render.js`** — one function per entity (`drawBase`, `drawPlayer`, …).
3. **All numbers in `config.js`** — no magic constants in logic or render.
4. **Fixed timestep cap** — `requestAnimationFrame` loop with delta time (capped).

---

*Older BudBoard (Next.js deals app) remains recoverable from git history before this milestone.*
