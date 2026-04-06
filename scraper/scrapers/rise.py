"""
TheBudBoard — RISE Dispensary Ocala scraper.

Platform    : Custom (Next.js + Algolia)
Dispensary  : 3871 SW College Rd, Ocala, FL 34474
Website     : risedispensaries.com
Dispensary ID: 5424 (found in page source / network requests)

⚠️  SCRAPER NOT YET IMPLEMENTED
    RISE uses a proprietary Next.js storefront with Algolia product search,
    similar to Trulieve but with a different Algolia App ID and index names.

HOW TO IMPLEMENT:
  1. Visit risedispensaries.com → select Ocala → browse Flower products
  2. Open DevTools → Application → Local Storage (or Network → Fetch/XHR)
  3. Look for keys: algolia_app_id, algolia_search_key (or check request headers
     for X-Algolia-Application-Id and X-Algolia-API-Key)
  4. Note the Algolia index name for Ocala (filter on "flower" or "Flower")
  5. Fill in _ALGOLIA_APP, _ALGOLIA_KEY, _INDEX, _DISPENSARY_ID below
  6. Replace the stub scrape() with logic from trulieve.py adapted for RISE

REFERENCE: See trulieve.py for a working Algolia implementation.
"""
from __future__ import annotations

import logging

from .base import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

_DISPENSARY_ID  = 5424   # confirmed
_ALGOLIA_APP    = ""     # TODO: find via DevTools → Local Storage → algolia_app_id
_ALGOLIA_KEY    = ""     # TODO: find via DevTools → Local Storage → algolia_search_key
_INDEX          = ""     # TODO: find Ocala Flower index name (e.g. "rise_ocala_products")


class RiseScraper(BaseScraper):
    """
    RISE Dispensary Ocala — stub until Algolia credentials are found.

    Logs a warning and returns empty results. See module docstring for
    instructions on completing this implementation.
    """

    def scrape(self) -> ScrapeResult:
        self.logger.warning(
            "RiseScraper is not yet implemented. "
            "See scraper/scrapers/rise.py for instructions on completing it. "
            "Returning empty results for %s.",
            self.dispensary_name,
        )
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )
