"""
TheBudBoard — Main scraper entry point.

Usage:
  python main.py                         # Run all dispensaries once
  python main.py --dispensary ayr        # Run one dispensary (partial name match)
  python main.py --dry-run               # Scrape but don't write to DB
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

import db
from scrapers import (
    # Original
    CuraleafScraper,
    SurterraScraper,
    TrulieveScraper,
    FluentScraper,
    # iHeartJane
    MuvScraper,
    # Dutchie classic
    AyrScraper,
    JungleBoysScraper,
    # Dutchie Plus
    GrowHealthyScraper,
    Planet13Scraper,
    # SweedPOS
    CuraleafMaricampScraper,
    GreenDragonScraper,
    GoldflowerScraper,
    # Custom / stub
    RiseScraper,
    SunnysideScraper,
    TheFloweryScraper,
)
from scrapers.base import BaseScraper, ScrapeResult

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("thebudboard.main")

# ── Scraper registry ─────────────────────────────────────────
# Keys are lowercased dispensary names as stored in the DB.
# When adding a new dispensary: add a row to supabase/seed.sql,
# then add the matching entry here.
SCRAPER_MAP: dict[str, type[BaseScraper]] = {
    # ── Original locations ───────────────────────────────────
    "trulieve":              TrulieveScraper,
    "curaleaf":              CuraleafScraper,       # SW College Rd location
    "surterra wellness":     SurterraScraper,
    "fluent":                FluentScraper,          # stub — no Ocala location

    # ── iHeartJane ───────────────────────────────────────────
    "müv":                   MuvScraper,
    "muv":                   MuvScraper,             # fallback without umlaut

    # ── Dutchie (classic) ────────────────────────────────────
    "ayr cannabis dispensary": AyrScraper,
    "jungle boys":             JungleBoysScraper,

    # ── Dutchie Plus ─────────────────────────────────────────
    "growhealthy":             GrowHealthyScraper,
    "planet 13":               Planet13Scraper,

    # ── SweedPOS ─────────────────────────────────────────────
    "curaleaf maricamp":       CuraleafMaricampScraper,
    "green dragon":            GreenDragonScraper,
    "goldflower":              GoldflowerScraper,

    # ── Custom / stub ─────────────────────────────────────────
    "rise dispensary":         RiseScraper,
    "sunnyside":               SunnysideScraper,
    "the flowery":             TheFloweryScraper,
}


def build_scrapers(dispensaries: list[dict]) -> dict[str, BaseScraper]:
    """
    Map dispensary DB records to scraper instances.

    Each scraper receives both dispensary_id (UUID) and dispensary_name
    so ScrapeResult can carry the human-readable name for logging.
    """
    scrapers: dict[str, BaseScraper] = {}

    for d in dispensaries:
        key = d["name"].lower()
        cls = SCRAPER_MAP.get(key)

        if cls is None:
            logger.warning("No scraper registered for dispensary: %s", d["name"])
            continue

        # Pass both id AND name so BaseScraper can log/tag results correctly.
        # dispensary_name has a default in each concrete class, but passing it
        # explicitly ensures it matches exactly what's in the DB.
        scrapers[d["name"]] = cls(
            dispensary_id=d["id"],
            dispensary_name=d["name"],
        )

    return scrapers


def run_scraper(
    scraper: BaseScraper,
    dry_run: bool = False,
) -> ScrapeResult:
    result = scraper.run()

    status       = "success" if result.success else "error"
    flower_count = len(result.products)
    logger.info(
        "%s: %s — %d flower variants (%.1fs)",
        result.dispensary_name,
        status.upper(),
        flower_count,
        result.duration_sec,
    )

    if result.error:
        logger.error("  Error: %s", result.error)

    if not dry_run:
        rows = [p.to_db_row() for p in result.products]
        db.replace_deals_for_dispensary(result.dispensary_id, rows)
        db.log_scrape(
            dispensary_id=result.dispensary_id,
            status=status,
            flower_products=flower_count,
            error_message=result.error,
            duration_sec=result.duration_sec,
        )
    else:
        logger.info("[DRY RUN] Would have inserted %d rows", flower_count)
        for p in result.products[:5]:
            logger.info(
                "  Sample: %s  %.1fg  $%.2f  THC=%.1f%%",
                p.product_name, p.weight_grams, p.price, p.thc_percent or 0,
            )

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="TheBudBoard scraper")
    parser.add_argument(
        "--dispensary",
        help="Run only this dispensary (case-insensitive partial name match)",
        default=None,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape but do not write to Supabase",
    )
    args = parser.parse_args()

    logger.info("=== TheBudBoard Scraper START ===")

    dispensaries = db.get_dispensaries()
    if not dispensaries:
        logger.error("No active dispensaries found in DB. Did you run supabase/seed.sql?")
        sys.exit(1)

    scrapers = build_scrapers(dispensaries)

    if args.dispensary:
        target  = args.dispensary.lower()
        scrapers = {k: v for k, v in scrapers.items() if target in k.lower()}
        if not scrapers:
            logger.error(
                "No scraper matched '%s'. Available: %s",
                target, list(scrapers.keys()),
            )
            sys.exit(1)

    results: list[ScrapeResult] = []
    for name, scraper in scrapers.items():
        logger.info("── Scraping: %s", name)
        r = run_scraper(scraper, dry_run=args.dry_run)
        results.append(r)

    # ── Summary ──────────────────────────────────────────────
    success        = sum(1 for r in results if r.success)
    total          = len(results)
    total_products = sum(len(r.products) for r in results)
    logger.info(
        "=== DONE: %d/%d scrapers OK · %d flower variants total ===",
        success, total, total_products,
    )

    if success < total:
        sys.exit(1)   # non-zero exit → Railway/cron alert


if __name__ == "__main__":
    main()
