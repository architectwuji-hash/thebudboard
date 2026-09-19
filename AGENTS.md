# Agent workflow — TheBudBoard game

Instructions for Cursor Cloud Agents and other automated contributors.

## Git and deploy

- Work **directly on `main`**. Do **not** open pull requests.
- Commit in **small, clear messages** and **push to `main`** when the task is done.
- Pushing to `main` deploys **www.thebudboard.com** via Vercel (`frontend/`, Vite build → `.next`). Apex **thebudboard.com** is on Cloudflare Pages and requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` GitHub secrets (and repo variable `CLOUDFLARE_PAGES_DEPLOY=true`) to deploy via `.github/workflows/cloudflare-pages.yml`, or a working Cloudflare Git integration on that project.
- After **every push**, verify production: `curl -sL https://thebudboard.com` (or fetch the page) and poll every **30 seconds** for up to **10 minutes** until the live HTML reflects your change.
- If the site does not update, **diagnose and fix** (build output path, broken build, wrong root directory, etc.) and push again. Do **not** ask the human to merge, deploy, or change dashboard settings unless a **login or permission is truly missing** — then state exactly what is needed.

## Game architecture

- **Logic and rendering are separate.** Logic never draws on the canvas.
- **All drawing** lives in `frontend/src/render.js` (one draw function per entity type). Shapes only for now; structure so sprites can replace shapes later.
- **All stats** live in `frontend/src/config.js`. No magic numbers in logic or render.
- Fixed game loop with **delta time** in `frontend/src/main.js`.

## Scope and testing

- **Never add features beyond the current milestone** unless explicitly requested.
- Test **desktop keyboard** (WASD / arrows) and **mobile touch** (left-half virtual joystick).
- End each milestone with a short report: **what was built**, **what is live on thebudboard.com**, and **how to test on iPhone**.

## Local commands

```bash
cd frontend && npm install && npm run dev    # dev server
cd frontend && npm run build                 # production → frontend/.next
```
