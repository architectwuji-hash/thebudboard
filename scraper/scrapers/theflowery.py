"""
TheBudBoard — The Flowery Ocala scraper.

Platform  : Custom (Nuxt.js / proprietary)
Location  : 1704 S Pine Ave, Ocala, FL 34471
Website   : theflowery.co

⚠️  SCRAPER NOT YET IMPLEMENTED
    The Flowery uses a custom Nuxt.js storefront with a proprietary ordering
    system. It does not appear to use Dutchie, Jane, SweedPOS, or Algolia.

HOW TO IMPLEMENT:
  1. Visit theflowery.co → select Ocala location → browse Flower products
  2. Open DevTools → Network → filter by XHR/Fetch
  3. Look for API calls returning product data (filter on /api/ or /products)
  4. Check for a REST endpoint like:
       GET /api/products?category=flower&store=ocala
       GET /v1/menu?location_id=XXX&type=flower
  5. If a usable API exists: implement a requests-based scraper
  6. If fully client-side: implement a Playwright scraper
  7. Remove the stub and replace scrape() with the real implementation

NOTE: The Flowery has a strong brand focus on quality; their site may have
more anti-bot measures than average. Test with Playwright first if REST fails.
"""
from __future__ import annotations

import logging

from .base import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

MENU_URL = "https://theflowery.co"   # TODO: find exact Ocala flower menu URL


class TheFloweryScraper(BaseScraper):
    """
    The Flowery Ocala — stub until platform API is reverse-engineered.

    Logs a warning and returns empty results. See module docstring for
    instructions on completing this implementation.
    """

    def scrape(self) -> ScrapeResult:
        self.logger.warning(
            "TheFloweryScraper is not yet implemented. "
            "See scraper/scrapers/theflowery.py for instructions. "
            "Returning empty results for %s.",
            self.dispensary_name,
        )
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )
