-- ============================================================
-- TheBudBoard — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Dispensaries ────────────────────────────────────────────
CREATE TABLE dispensaries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT DEFAULT 'Ocala',
  state         TEXT DEFAULT 'FL',
  zip           TEXT,
  website       TEXT,
  menu_provider TEXT,   -- 'dutchie' | 'jane' | 'leafly' | 'custom'
  menu_slug     TEXT,   -- provider-specific store identifier
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Flower Deals (live snapshot, replaced each scrape run) ──
CREATE TABLE flower_deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensary_id   UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
  product_name    TEXT NOT NULL,
  strain_type     TEXT CHECK (strain_type IN ('Indica', 'Sativa', 'Hybrid', 'Unknown')),
  thc_percent     DECIMAL(5,2),
  cbd_percent     DECIMAL(5,2),
  weight_grams    DECIMAL(8,3) NOT NULL,
  price           DECIMAL(8,2) NOT NULL,
  price_per_gram  DECIMAL(10,4) GENERATED ALWAYS AS (price / NULLIF(weight_grams, 0)) STORED,
  primary_terpene TEXT,
  effect          TEXT,
  brand           TEXT,
  in_stock        BOOLEAN DEFAULT true,
  image_url       TEXT,
  product_url     TEXT,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Scrape Run Logs ─────────────────────────────────────────
CREATE TABLE scrape_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensary_id    UUID REFERENCES dispensaries(id),
  status           TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  products_found   INTEGER DEFAULT 0,
  flower_products  INTEGER DEFAULT 0,
  error_message    TEXT,
  duration_seconds DECIMAL(8,2),
  scraped_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Deal Alert Signups (text / email) ───────────────────────
CREATE TABLE deal_notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id          UUID REFERENCES flower_deals(id),
  contact_type     TEXT CHECK (contact_type IN ('text', 'email')),
  contact_value    TEXT NOT NULL,
  dispensary_name  TEXT,
  product_name     TEXT,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_flower_deals_dispensary ON flower_deals(dispensary_id);
CREATE INDEX idx_flower_deals_weight     ON flower_deals(weight_grams);
CREATE INDEX idx_flower_deals_price      ON flower_deals(price ASC);
CREATE INDEX idx_flower_deals_thc        ON flower_deals(thc_percent DESC NULLS LAST);
CREATE INDEX idx_flower_deals_scraped    ON flower_deals(scraped_at DESC);
CREATE INDEX idx_flower_deals_in_stock   ON flower_deals(in_stock) WHERE in_stock = true;

-- ── Computed View: Best Deals Per Weight ────────────────────
-- Used by the Next.js /api/deals route
CREATE OR REPLACE VIEW best_deals_by_weight AS
SELECT
  fd.*,
  d.name    AS dispensary_name,
  d.address AS dispensary_address,
  RANK() OVER (
    PARTITION BY fd.weight_grams
    ORDER BY fd.price ASC
  ) AS price_rank,
  RANK() OVER (
    PARTITION BY fd.weight_grams
    ORDER BY CASE WHEN fd.thc_percent >= 20 THEN fd.price ELSE 9999999 END ASC
  ) AS budget20_rank,
  RANK() OVER (
    PARTITION BY fd.weight_grams
    ORDER BY fd.thc_percent DESC NULLS LAST
  ) AS thc_rank
FROM flower_deals fd
JOIN dispensaries d ON fd.dispensary_id = d.id
WHERE fd.in_stock = true
  AND fd.scraped_at > NOW() - INTERVAL '8 hours';

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE dispensaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_deals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;

-- Frontend (anon key): read-only
CREATE POLICY "Public read dispensaries"  ON dispensaries       FOR SELECT USING (true);
CREATE POLICY "Public read flower_deals"  ON flower_deals       FOR SELECT USING (true);
CREATE POLICY "Public insert notify"      ON deal_notifications FOR INSERT WITH CHECK (true);

-- Scraper (service_role key): full write
CREATE POLICY "Service all flower_deals"  ON flower_deals   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service all scrape_logs"   ON scrape_logs    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service all dispensaries"  ON dispensaries   FOR ALL USING (auth.role() = 'service_role');
