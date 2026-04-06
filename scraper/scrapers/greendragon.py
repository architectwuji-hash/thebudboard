"""
TheBudBoard — Green Dragon Ocala scraper.

Platform  : SweedPOS (Playwright required)
Store ID  : 89
Location  : 2645 E Silver Springs Blvd, Ocala, FL 34470

Menu URL confirmed: https://shop.greendragon.com/ocala/menu/flower-142
"""
from __future__ import annotations

from .sweedpos import SweedPosScraper

# URL confirmed by user. storeId=89, categoryId=142.
_MENU_URL = "https://shop.greendragon.com/ocala/menu/flower-142"


class GreenDragonScraper(SweedPosScraper):
    """
    Green Dragon Ocala — SweedPOS Playwright scraper.

    Scrapes the Green Dragon Ocala flower menu via SweedPOS + Playwright.
    """
    MENU_URL = _MENU_URL

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str = "Green Dragon",
    ):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
        )
