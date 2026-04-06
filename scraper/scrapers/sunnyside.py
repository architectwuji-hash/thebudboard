"""
TheBudBoard — Sunnyside Ocala scraper.

Platform  : Custom (sunnyside.shop / Cresco Labs)
Location  : 811 NE 36th Ave, Ocala, FL 34479
Website   : sunnyside.shop

⚠️  SCRAPER NOT YET IMPLEMENTED
    Sunnyside is a Cresco Labs brand that uses a proprietary ordering platform
    at sunnyside.shop. The platform is custom-built and doesn't appear to use
    Dutchie, Jane, or SweedPOS.

HOW TO IMPLEMENT:
  1. Visit sunnyside.shop → select Ocala location → browse Flower category
  2. Open DevTools → Network → look for XHR/Fetch requests that return
     product JSON (filter by XHR, look for /api/ calls)
  3. If product data comes from a REST API:
       - Note the endpoint URL, required headers, and response structure
       - Implement a requests-based scraper (see surterra.py for reference)
  4. If product data is rendered client-side with no accessible REST API:
       - Use Playwright (see sweedpos.py / curaleaf.py for reference)
  5. Remove the stub and replace scrape() with the real implementation

NOTE: Sunnyside may require selecting a store/location before showing products.
Look for a store_id or location_id in the API requests.
"""
from __future__ import annotations

import logging

from .base import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

MENU_URL = "https://sunnyside.shop"   # TODO: find exact Ocala flower menu URL


class SunnysideScraper(BaseScraper):
    """
    Sunnyside Ocala — stub until platform API is reverse-engineered.

    Logs a warning and returns empty results. See module docstring for
    instructions on completing this implementation.
    """

    def scrape(self) -> ScrapeResult:
        self.logger.warning(
            "SunnysideScraper is not yet implemented. "
            "See scraper/scrapers/sunnyside.py for instructions. "
            "Returning empty results for %s.",
            self.dispensary_name,
        )
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )
