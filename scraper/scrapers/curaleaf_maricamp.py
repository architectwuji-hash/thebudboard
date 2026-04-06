"""
TheBudBoard — Curaleaf Maricamp Road Ocala scraper.

Platform  : SweedPOS (Playwright required)
Store ID  : confirmed via SweedPOS network inspection
Category  : Flower, categoryId=1522
Menu URL  : https://curaleaf.com/shop/florida/curaleaf-ocala-maricamp/menu/flower-1522

This is Curaleaf's second Ocala location (SE Maricamp Rd), distinct from
the College Rd location handled by curaleaf.py.

HOW URL WAS FOUND:
  Visited curaleaf.com/stores → selected Maricamp Rd location →
  navigated to Flower category → copied URL from browser.
"""
from __future__ import annotations

from .sweedpos import SweedPosScraper

_MENU_URL = (
    "https://curaleaf.com/shop/florida"
    "/curaleaf-ocala-maricamp/menu/flower-1522"
)


class CuraleafMaricampScraper(SweedPosScraper):
    """Curaleaf Maricamp Rd Ocala — SweedPOS Playwright scraper."""

    MENU_URL = _MENU_URL

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str = "Curaleaf Maricamp",
    ):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
        )
