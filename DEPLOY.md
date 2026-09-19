# Deployment — thebudboard.com (game)

The live site is a **static Vite build** from the [`frontend/`](frontend/) folder. Vite writes to **`frontend/.next`** so the existing Cloudflare Pages output directory does not need a dashboard change.

## Cloudflare Pages (primary — Git integration)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → your **thebudboard** project.
2. **Settings → Builds & deployments** — confirm:

| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `.next` |

3. Confirm the project is connected to **`github.com/architectwuji-hash/thebudboard`**.

After every push to **`main`**, Cloudflare should start a new **Production** deployment (usually 1–3 minutes). Check **Deployments** in the dashboard if the live site lags.

Custom domains (`thebudboard.com`, `www`) stay on the same Pages project.

### Verification checklist (one-time)

- [ ] Production branch is **`main`**
- [ ] Root directory is **`frontend`**
- [ ] Build output is **`.next`** (not legacy `dist` or repo-root `.next`)
- [ ] Latest **`main`** commit appears as a successful Production deployment
- [ ] `curl -sL https://thebudboard.com` returns the Vite game HTML (`<canvas id="game">`)

## Automatic production deploys (Cloud Agents)

Cloud Agents should open **pull requests into `main`** from branches named **`cursor/*`**. GitHub Actions then:

1. **Frontend build** (`.github/workflows/frontend-build.yml`) — `npm ci` + `npm run build` in `frontend/`
2. **Auto-merge agent PR** (`.github/workflows/auto-merge-agent-pr.yml`) — on green CI, marks draft PRs ready, squash-merges `cursor/*` → **`main`**, deletes the head branch
3. **Cloudflare Pages** — builds and publishes **`main`** to **thebudboard.com**

```text
cursor/* branch → PR to main → CI green → auto-merge → push to main → Cloudflare deploy
```

### GitHub settings

- **Settings → Actions → General:** allow workflows to create and approve pull requests (or supply a PAT secret if the default `GITHUB_TOKEN` cannot merge).
- Optional: **branch protection** on **`main`** requiring the **Frontend build** check before merge.

### Safety knobs

| Knob | Effect |
|------|--------|
| Branch filter | Only `cursor/*` heads are auto-merged (configured in the workflow) |
| Disable auto-merge | Remove or disable `auto-merge-agent-pr.yml`; keep CI only and merge manually |
| Preview deployments | Enable Cloudflare preview builds for non-`main` branches to test without production |

## Optional: Wrangler deploy from GitHub Actions

If Git-connected Pages is not used, set repository variable **`CLOUDFLARE_PAGES_DEPLOY=true`** and secrets **`CLOUDFLARE_API_TOKEN`**, **`CLOUDFLARE_ACCOUNT_ID`**. Pushes to **`main`** run [`.github/workflows/cloudflare-pages.yml`](.github/workflows/cloudflare-pages.yml), which deploys **`frontend/.next`**.

## Local verify before push

```bash
cd frontend && npm install && npm run build && npm run preview
```

---

## Legacy services (not used by the game site)

The repo still contains `scraper/` and `supabase/` from the previous BudBoard deals app. They are **not** part of the static game deploy.
