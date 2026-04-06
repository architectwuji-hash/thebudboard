"""
TheBudBoard — GrowHealthy Ocala scraper.

Platform   : Dutchie Plus (DfB)
RetailerId : c50c3985-4ddb-43d4-9f67-f5e6665d58d8
Location   : 2370 SW College Rd #104, Ocala, FL 34474
Menu URL   : https://growhealthy.com/product-category/flower/ (Dutchie Plus embed)

HOW RETAILER ID WAS FOUND:
  Visited growhealthy.com → selected Ocala location → inspected Dutchie Plus
  GraphQL network request, found retailerId in the variables object.
"""
from __future__ import annotations

from .dutchie_plus import DutchiePlusScraper

_RETAILER_ID = "c50c3985-4ddb-43d4-9f67-f5e6665d58d8"
_MENU_URL    = "https://growhealthy.com/product-category/flower/"


class GrowHealthyScraper(DutchiePlusScraper):
    """GrowHealthy Ocala — Dutchie Plus embedded menu."""

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str = "GrowHealthy",
    ):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
            retailer_id=_RETAILER_ID,
            menu_url=_MENU_URL,
        )
