-- ============================================================
-- TheBudBoard — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ── Dispensaries ─────────────────────────────────────────────
-- All active Ocala-area dispensaries as of April 2026.
-- The 'menu_provider' column is informational; the scraper map in
-- main.py is the authoritative source of which scraper class is used.

INSERT INTO dispensaries (name, address, zip, website, menu_provider, menu_slug, active) VALUES

  -- ── Original 4 ───────────────────────────────────────────
  ('Trulieve',
   '3003 SW College Rd, Ocala, FL',        '34474',
   'https://trulieve.com',        'algolia',   'magento2_prod_ocala_products',     true),

  ('Curaleaf',
   '2600 SW College Rd, Ocala, FL',        '34474',
   'https://curaleaf.com',        'sweedpos',  'curaleaf-dispensary-ocala',        true),

  ('Surterra Wellness',
   '2415 E Silver Springs Blvd, Ocala, FL','34470',
   'https://surterra.com',        'jane',      '4735',                             true),

  ('Fluent',
   NULL,                                   NULL,
   'https://getfluent.com',       'stub',      NULL,                               false),

  -- ── New dispensaries (April 2026 expansion) ───────────────

  ('RISE Dispensary',
   '3871 SW College Rd, Ocala, FL',        '34474',
   'https://risedispensaries.com','algolia',   '5424',                             true),

  ('Goldflower',
   '2613 SW 19th Ave Rd, Ocala, FL',       '34474',
   'https://www.goldflowerfl.com', 'sweedpos',  'ocala-flower-362',                 true),

  ('Jungle Boys',
   '2301 N Pine Ave, Ocala, FL',           '34475',
   'https://jungleboysdispensaries.com','dutchie','jungle-boys-fl-ocala',          true),

  ('The Flowery',
   '1704 S Pine Ave, Ocala, FL',           '34471',
   'https://theflowery.co',       'custom',    NULL,                               true),

  ('AYR Cannabis Dispensary',
   '4920 E Silver Springs Blvd, Ocala, FL','34470',
   'https://www.ayrcannabis.com', 'dutchie',   'liberty-health-sciences-ocala',    true),

  ('Planet 13',
   '8810 SW SR 200 #101, Ocala, FL',       '34481',
   'https://planet13dispensaries.com','dutchie_plus','9c39abdd-be22-48af-9815-cda0f2269ec8', true),

  ('Sunnyside',
   '811 NE 36th Ave, Ocala, FL',           '34479',
   'https://sunnyside.shop',      'custom',    NULL,                               true),

  ('GrowHealthy',
   '2370 SW College Rd #104, Ocala, FL',   '34474',
   'https://growhealthy.com',     'dutchie_plus','c50c3985-4ddb-43d4-9f67-f5e6665d58d8', true),

  ('MÜV',
   '3701 SW College Rd, Ocala, FL',        '34474',
   'https://muvfl.com',           'jane',      '316',                              true),

  ('Green Dragon',
   '2645 E Silver Springs Blvd, Ocala, FL','34470',
   'https://shop.greendragon.com', 'sweedpos',  'ocala-flower-142',                 true),

  ('Curaleaf Maricamp',
   '9268 SE Maricamp Rd, Ocala, FL',       '34472',
   'https://curaleaf.com',        'sweedpos',  'curaleaf-ocala-maricamp',          true);


-- ── Demo Deals (replace once scrapers are live) ──────────────
-- Prototype data so the frontend works before scrapers run.
-- Limited to dispensaries with confirmed working scrapers.

DO $$
DECLARE
  trulieve_id   UUID;
  curaleaf_id   UUID;
  surterra_id   UUID;
  muv_id        UUID;
  ayr_id        UUID;
  jungle_id     UUID;
BEGIN
  SELECT id INTO trulieve_id FROM dispensaries WHERE name = 'Trulieve';
  SELECT id INTO curaleaf_id FROM dispensaries WHERE name = 'Curaleaf';
  SELECT id INTO surterra_id FROM dispensaries WHERE name = 'Surterra Wellness';
  SELECT id INTO muv_id       FROM dispensaries WHERE name = 'MÜV';
  SELECT id INTO ayr_id       FROM dispensaries WHERE name = 'AYR Cannabis Dispensary';
  SELECT id INTO jungle_id    FROM dispensaries WHERE name = 'Jungle Boys';

  INSERT INTO flower_deals
    (dispensary_id, product_name, strain_type, thc_percent, weight_grams, price,
     primary_terpene, effect, in_stock)
  VALUES
    -- 1g
    (surterra_id,  'Sour Diesel',       'Sativa', 19.2,  1.0,  8,    'Terpinolene', 'Energizing', true),
    (curaleaf_id,  'Blue Dream',        'Hybrid', 22.4,  1.0,  10,   'Myrcene',     'Uplifting',  true),
    (muv_id,       'Rainbow Chip',      'Hybrid', 28.1,  1.0,  15,   'Limonene',    'Euphoric',   true),

    -- 3.5g
    (trulieve_id,  'Northern Lights',   'Indica', 18.9,  3.5,  18,   'Myrcene',     'Sleep',      true),
    (trulieve_id,  'Wedding Cake',      'Hybrid', 29.4,  3.5,  25,   'Caryophyllene','Relaxing',  true),
    (ayr_id,       'Gelato 41',         'Hybrid', 27.3,  3.5,  30,   'Caryophyllene','Relaxing',  true),
    (jungle_id,    'Papaya Cake',       'Indica', 31.0,  3.5,  38,   'Myrcene',     'Sleep',      true),
    (muv_id,       'MAC 1',             'Hybrid', 33.1,  3.5,  40,   'Limonene',    'Creative',   true),

    -- 7g
    (surterra_id,  'House Blend',       'Hybrid', 17.2,  7.0,  30,   'Myrcene',     'Relaxing',   true),
    (trulieve_id,  'TruFlower OG',      'Indica', 21.0,  7.0,  36,   'Myrcene',     'Relaxing',   true),
    (ayr_id,       'Lemon Haze',        'Sativa', 22.5,  7.0,  42,   'Terpinolene', 'Energizing', true),

    -- 14g
    (trulieve_id,  'Green Crack',       'Sativa', 18.1, 14.0,  55,   'Ocimene',     'Focused',    true),
    (surterra_id,  'Sunset Sherbet',    'Hybrid', 23.5, 14.0,  68,   'Limonene',    'Euphoric',   true),
    (curaleaf_id,  'MAC 1',             'Hybrid', 33.1, 14.0, 110,   'Limonene',    'Creative',   true),

    -- 28g
    (surterra_id,  'House Blend',       'Hybrid', 17.2, 28.0,  95,   'Myrcene',     'Relaxing',   true),
    (curaleaf_id,  'Blue Dream',        'Sativa', 22.4, 28.0, 120,   'Myrcene',     'Uplifting',  true),
    (trulieve_id,  'BOGO OG',           'Indica', 20.5, 28.0,  99,   'Myrcene',     'Sleep',      true);

END $$;
