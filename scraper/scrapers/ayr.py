"""
TheBudBoard — AYR Cannabis Dispensary Ocala scraper.

Platform  : Dutchie (classic GraphQL)
Slug      : liberty-health-sciences-ocala
Menu URL  : https://dutchie.com/embedded-menu/liberty-health-sciences-ocala/products

AYR acquired Liberty Health Sciences. The Dutchie slug still reflects
the Liberty Health Sciences brand name as of early 2026.

HOW SLUG WAS FOUND:
  Visited ayrcannabis.com/locations/florida/ocala → inspected Dutchie iframe src
"""
from __future__ import annotations

from .dutchie import DutchieScraper

_SLUG     = "liberty-health-sciences-ocala"
_BASE_URL = "https://www.ayrcannabis.com"


class AyrScraper(DutchieScraper):
    """AYR Cannabis Dispensary Ocala — Dutchie classic embedded menu."""

    def __init__(self, dispensary_id: str, dispensary_name: str = "AYR Cannabis Dispensary"):
        super().__init__(
            dispensary_id=dispensary_id,
            dispensary_name=dispensary_name,
            dutchie_slug=_SLUG,
            base_url=_BASE_URL,
        )
