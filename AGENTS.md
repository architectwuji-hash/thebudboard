# Agent workflow — TheBudBoard game

Instructions for Cursor Cloud Agents and other automated contributors.

## Git and deploy

- Use feature branches named **`cursor/<description>-132c`** and open **pull requests against `main`** (draft is fine).
- Green **Frontend build** CI triggers **auto-merge** for `cursor/*` PRs; merged **`main`** deploys **thebudboard.com** via Cloudflare Pages (Git integration on `frontend/`, output `.next`). See [DEPLOY.md](DEPLOY.md).
- After the PR merges, verify production: `curl -sL https://thebudboard.com` and poll every **30 seconds** for up to **10 minutes** until the live HTML reflects your change.
- If the site does not update, **diagnose and fix** (build failure, wrong output path, Cloudflare settings) and push again. Escalate only when a login or permission is impossible — state exactly what is missing.

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
