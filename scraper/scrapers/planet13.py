"""
TheBudBoard — Planet 13 Ocala scraper.

Platform   : Dutchie Plus (DfB)
RetailerId : 9c39abdd-be22-48af-9815-cda0f2269ec8
Location   : 8810 SW SR 200 #101, Ocala, FL 34481
Menu URL   : https://planet13dispensaries.com/florida/ocala/ (Dutchie Plus embed)

HOW RETAILER ID WAS FOUND:
  Visited planet13dispensaries.com → selected Ocala location → inspected
  Dutchie Plus GraphQL network request, found retailerId in variables.
"""
from __future__ import annotations

from .dutchie_plus import DutchiePlusScraper

_RETAILER_ID = "9c39abdd-be22-48af-9815-cda0f2269ec8"
_MENU_URL    = "https://planet13dispensaries.com/florida/ocala/"


class Planet13Scraper(DutchiePlusScraper):
    """Planet 13 Ocala — Dutchie Plus embedded menu."""

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str = "Planet 13",
    ):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
            retailer_id=_RETAILER_ID,
            menu_url=_MENU_URL,
        )
