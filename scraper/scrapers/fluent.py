"""
TheBudBoard — Fluent (Knox Medical) Ocala scraper.

NOTE: As of April 2026, Fluent has NO dispensary in Ocala, FL.
Their nearest locations are Fruitland Park and Gainesville.
This scraper is a no-op stub. It will be activated if/when
Fluent opens an Ocala location.

To activate: find the iHeartJane store ID for the Ocala location,
set FLUENT_STORE_ID below, and remove the early-return from scrape().
"""
from __future__ import annotations

import logging

from .base import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

# Update when Fluent opens in Ocala and is listed on iHeartJane
FLUENT_STORE_ID: int | None = None


class FluentScraper(BaseScraper):
    """Stub — Fluent has no Ocala location yet."""

    def scrape(self) -> ScrapeResult:
        logger.info(
            "FluentScraper: skipped — no Ocala location exists as of 2026-04."
        )
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
            products=[],
        )
