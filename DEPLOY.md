# Deployment — thebudboard.com (game)

The live site is a **static Vite build** from the `frontend/` folder.

## Cloudflare Pages (recommended)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → your existing **thebudboard** project (keep domain + Git connection).
2. **Settings → Builds & deployments** — confirm:

| Setting | Value |
|---------|--------|
| Production branch | `main` (or your chosen branch) |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `.next` |

3. Save and **Retry deployment** after merging game changes.

Custom domains (`thebudboard.com`, `www`) stay attached to the same Pages project — no DNS changes needed when switching from Next.js to Vite if the project name is unchanged.

## Local verify before push

```bash
cd frontend && npm install && npm run build && npm run preview
```

---

## Legacy services (not used by the game site)

The repo still contains `scraper/` and `supabase/` from the previous BudBoard deals app. They are **not** part of the static game deploy. See git history for the former Next.js frontend.

The game is Vite; build output directory stays **`.next`** to match the existing Cloudflare Pages setting (no dashboard change required).
