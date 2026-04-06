"""
TheBudBoard — Jungle Boys Ocala scraper.

Platform  : Dutchie (classic GraphQL)
Slug      : jungle-boys-fl-ocala
Menu URL  : https://dutchie.com/embedded-menu/jungle-boys-fl-ocala/products

HOW SLUG WAS FOUND:
  Visited jungleboysdispensaries.com → selected Ocala location → inspected
  network requests in DevTools, found Dutchie GraphQL call with this slug.
"""
from __future__ import annotations

from .dutchie import DutchieScraper

_SLUG     = "jungle-boys-fl-ocala"
_BASE_URL = "https://jungleboysdispensaries.com"


class JungleBoysScraper(DutchieScraper):
    """Jungle Boys Ocala — Dutchie classic embedded menu."""

    def __init__(self, dispensary_id: str, dispensary_name: str = "Jungle Boys"):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
            dutchie_slug=_SLUG,
            base_url=_BASE_URL,
        )
