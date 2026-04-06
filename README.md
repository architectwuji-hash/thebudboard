# TheBudBoard 🌿
**Real-time medical cannabis flower deals for Ocala, FL**

Stack: Next.js 14 · Supabase (PostgreSQL) · Python scraper · Railway · Cloudflare

---

## Project Structure

```
thebudboard/
├── supabase/         SQL schema + seed data
├── frontend/         Next.js 14 app (App Router, TypeScript)
│   ├── app/          Pages + API routes
│   ├── components/   Header, WeightSelector, CategoryCard, DealModal
│   └── lib/          Supabase client + shared types
└── scraper/          Python scraper + scheduler
    └── scrapers/     Per-dispensary scrapers (Dutchie, Jane, Trulieve)
```

---

## 1 — Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste + run `supabase/schema.sql`
4. Paste + run `supabase/seed.sql`  (loads 4 dispensaries + demo deals)
5. Copy your keys from **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  (frontend read-only)
   - `SUPABASE_SERVICE_KEY`           (scraper write access — keep secret)

---

## 2 — Frontend (Next.js → Cloudflare Pages)

### Local dev
```bash
cd frontend
cp .env.example .env.local    # fill in your Supabase URL + anon key
npm install
npm run dev                   # http://localhost:3000
```

### Deploy to Cloudflare Pages
1. Push the `frontend/` folder to a GitHub repo
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages → Create a project**
3. Connect your GitHub repo
4. Build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
5. Add environment variables (same as `.env.local`)
6. Deploy!

### Connect your domain
1. Cloudflare Dashboard → Pages → your project → **Custom domains**
2. Add `thebudboard.com` and `www.thebudboard.com`
3. Cloudflare will auto-configure DNS (since you're already on Cloudflare)

---

## 3 — Scraper (Python → Railway)

### Find your dispensary slugs/IDs FIRST
Each scraper has a `# UPDATE THIS` comment at the top. Before deploying:

| Dispensary | File | What to find |
|------------|------|--------------|
| Curaleaf | `scrapers/curaleaf.py` | Dutchie slug (see instructions in file) |
| Surterra | `scrapers/surterra.py` | Dutchie slug |
| Trulieve | `scrapers/trulieve.py` | Store ID from their API |
| Fluent | `scrapers/fluent.py` | Jane store ID |

**Quickest method for Dutchie scrapers:**
```
1. Open the dispensary's menu in Chrome
2. DevTools (F12) → Network tab → filter: dutchie
3. Click any filter/category on the menu
4. Find a request to dutchie.com/graphql
5. In the request payload (JSON), copy the "slug" value
```

### Test locally
```bash
cd scraper
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
python main.py --dry-run          # test without writing to DB
python main.py --dispensary curaleaf    # test one dispensary
python main.py                    # run all
```

### Deploy to Railway
1. Push the `scraper/` folder to a GitHub repo (can be same or separate repo)
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select the repo / point to `scraper/` directory
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Railway reads `railway.toml` and `Procfile` automatically
6. The scraper starts, runs immediately, then every 3 hours

---

## 4 — Scraper Troubleshooting

### Trulieve returns 403
Trulieve's API is behind Cloudflare. If you get a 403:
1. Install Playwright: uncomment it in `requirements.txt`, then run `playwright install chromium`
2. Replace the `requests.get(...)` call in `scrapers/trulieve.py` with:
```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://trulieve.com/dispensary-menu/?store=ocala-sw-college-rd")
    # wait for and extract the JSON from network response
```

### Dutchie slug not working
- Try appending your city to the slug: `curaleaf-florida-ocala`
- Check the Dutchie embedded menu URL directly: `https://dutchie.com/embedded-menu/YOUR-SLUG/products`

### No deals showing in UI
1. Check `scrape_logs` table in Supabase (SQL Editor: `SELECT * FROM scrape_logs ORDER BY scraped_at DESC LIMIT 20`)
2. Check `flower_deals` table has rows: `SELECT COUNT(*) FROM flower_deals`
3. Check the view works: `SELECT * FROM best_deals_by_weight LIMIT 10`

---

## 5 — Adding a New Dispensary

1. Add a row to `dispensaries` table in Supabase
2. Create `scraper/scrapers/mynewdispensary.py` (copy `curaleaf.py` as template)
3. Register it in `scraper/scrapers/__init__.py` and `scraper/main.py`
4. Test with `python main.py --dispensary mynewdispensary --dry-run`

---

## 6 — Optional: SMS / Email Alerts

Set these env vars in your Cloudflare Pages project to enable deal alerts:

| Feature | Env Var |
|---------|---------|
| Twilio SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |
| SendGrid Email | `SENDGRID_API_KEY`, `SENDGRID_FROM` |

Without these, alert signups are still saved to Supabase but no message is sent.

---

## Quick Links
- Supabase Dashboard: https://supabase.com/dashboard
- Railway Dashboard:  https://railway.app/dashboard
- Cloudflare Pages:   https://dash.cloudflare.com → Pages
- Dutchie Embeds:     https://dutchie.com/embedded-menu/[YOUR-SLUG]/products
- Jane/iHeartJane:    https://api.iheartjane.com/v1/stores/[STORE-ID]/products

---

*TheBudBoard — For medical patients only. Not affiliated with any dispensary.*
