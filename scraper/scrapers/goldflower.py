"""
TheBudBoard — Goldflower Ocala scraper.

Platform  : SweedPOS (Playwright required)
Store ID  : 37
Location  : 2613 SW 19th Ave Rd, Ocala, FL 34474

Menu URL confirmed: https://www.goldflowerfl.com/locations/ocala/menu/menu/flower-362
"""
from __future__ import annotations

from .sweedpos import SweedPosScraper

# URL confirmed by user. storeId=37, categoryId=362.
_MENU_URL = "https://www.goldflowerfl.com/locations/ocala/menu/menu/flower-362"


class GoldflowerScraper(SweedPosScraper):
    """
    Goldflower Ocala — SweedPOS Playwright scraper.

    Scrapes the Goldflower Ocala flower menu via SweedPOS + Playwright.
    """
    MENU_URL = _MENU_URL

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str = "Goldflower",
    ):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
        )
