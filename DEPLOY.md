# TheBudBoard — Deployment Guide

Three services to set up: **Supabase** (database) → **Railway** (scraper) → **Vercel** (website).
Do them in this order since each step depends on the one before it.

---

## 1. Push to GitHub (do this first)

If you haven't already:

1. Go to github.com → New repository → name it `thebudboard` → Create
2. In your terminal, from the `thebudboard/` folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/thebudboard.git
git push -u origin main
```

---

## 2. Supabase (Database)

**Create the project:**
1. Go to [supabase.com](https://supabase.com) → Sign in → New project
2. Name: `thebudboard`
3. Database password: generate a strong one and save it
4. Region: **US East (N. Virginia)** — closest to Ocala
5. Click **Create new project** (takes ~2 min to spin up)

**Run the schema:**
1. In your Supabase project → **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** — you should see "Success. No rows returned"

**Run the seed data:**
1. **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/seed.sql`
3. Click **Run** — should see "Success. No rows returned"
4. Verify: go to **Table Editor** → `dispensaries` — you should see 15 rows

**Copy your keys** (you'll need these for Railway and Vercel):
1. Go to **Settings** → **API**
2. Copy **Project URL** → looks like `https://abcdefghijklm.supabase.co`
3. Copy **anon / public** key → long `eyJ...` string (for Vercel)
4. Copy **service_role** key → different long `eyJ...` string (for Railway — keep secret!)

---

## 3. Railway (Scraper — runs every 3 hours)

**Create the project:**
1. Go to [railway.app](https://railway.app) → Sign in with GitHub → **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `thebudboard` repo
4. Railway will detect the repo — click **Add service** → **GitHub Repo**

**Set the root directory:**
1. Click on the service → **Settings** tab
2. Under **Source** → **Root Directory** → type `scraper`
3. Railway will now use `scraper/Dockerfile` to build

**Add environment variables:**
1. Click **Variables** tab → **New Variable** for each:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase **service_role** key |

**Deploy:**
1. Railway will automatically build and deploy
2. First run scrapes immediately, then every 3 hours
3. Check **Logs** tab to watch it run — look for `=== TheBudBoard Scraper START ===`
4. After it finishes, check Supabase Table Editor → `flower_deals` for live data

> **Build time note:** The first build takes 5–10 minutes because it downloads Chromium.
> Subsequent deploys are faster (Docker layer cache).

---

## 4. Vercel (Website)

**Create the project:**
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub → **Add New Project**
2. Import your `thebudboard` repository
3. **Framework Preset**: Vercel should auto-detect **Next.js** ✓
4. **Root Directory**: click **Edit** → type `frontend`
5. Leave Build Command and Output Directory as defaults

**Add environment variables:**
Click **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon/public** key |

**Deploy:**
1. Click **Deploy** — takes about 1 minute
2. Vercel gives you a URL like `thebudboard.vercel.app`

**Connect your domain (thebudboard.com):**
1. Vercel → your project → **Settings** → **Domains**
2. Add `thebudboard.com` and `www.thebudboard.com`
3. Vercel shows you DNS records to add
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Add the records Vercel shows you (usually 2 CNAME records or an A record)
6. DNS propagates in 10–30 minutes → site is live at thebudboard.com

---

## What Happens After Deploy

```
Every 3 hours:
  Railway runs scheduler.py
    → main.py scrapes all 12 active dispensaries
    → writes to Supabase flower_deals table

When a user visits thebudboard.com:
  Browser loads Next.js page
    → calls /api/deals
    → Supabase returns best deals from the last 8 hours
    → page renders with live price comparisons
```

---

## Troubleshooting

**Railway build fails:**
- Check Logs → look for the error
- Most common: Playwright/Chromium install timeout → retry the deploy

**Scraper runs but 0 products:**
- Check Railway Logs for `WARNING` messages
- Run locally first: `python main.py --dispensary trulieve --dry-run`

**Vercel build fails:**
- Check that Root Directory is set to `frontend`
- Make sure both env vars are set

**Site shows "Could not load deals":**
- Confirm scraper has run at least once (check `flower_deals` table has rows)
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel

**Deals are stale (older than 8 hours):**
- Check Railway → your service is still running (not crashed)
- Check `scrape_logs` table in Supabase for recent entries
