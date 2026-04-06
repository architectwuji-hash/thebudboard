"""
TheBudBoard — Trulieve Ocala scraper.

Platform : Trulieve custom Magento 2 + Algolia search
Stores   : "Ocala" (College Rd, id=220)  → index magento2_prod_ocala_products
           "Ocala SR 200" (id=447)        → index magento2_prod_ocala_sr_200_products
API      : Algolia REST  https://MRRFXDV39C-dsn.algolia.net
Key      : public search-only key embedded in every Trulieve page
"""
from __future__ import annotations

import logging
import requests

from .base import BaseScraper, FlowerProduct, ScrapeResult

logger = logging.getLogger(__name__)

_ALGOLIA_APP  = "MRRFXDV39C"
_ALGOLIA_KEY  = "3888375ac9af337d9ffac51297f73646"
_ALGOLIA_BASE = f"https://{_ALGOLIA_APP}-dsn.algolia.net/1/indexes"

# Both Ocala store indices — we merge and deduplicate by objectID
_INDICES = [
    "magento2_prod_ocala_products",
    "magento2_prod_ocala_sr_200_products",
]

# Trulieve `units` field → grams
_WEIGHT_MAP: dict[str, float] = {
    "1g":    1.0,
    "3.5g":  3.5,
    "7g":    7.0,
    "14g":   14.0,
    "28g":   28.0,
    "1/8oz": 3.5,
    "1/4oz": 7.0,
    "1/2oz": 14.0,
    "1oz":   28.0,
}

PRODUCT_BASE_URL = "https://www.trulieve.com/shopd/product/"


def _parse_weight(units: str | None) -> float | None:
    if not units:
        return None
    key = units.strip().lower().replace(" ", "")
    if key in _WEIGHT_MAP:
        return _WEIGHT_MAP[key]
    return BaseScraper.normalize_weight(units)


def _query_index(index: str) -> list[dict]:
    """Pull all flower products from a single Algolia index (paginated)."""
    headers = {
        "X-Algolia-Application-Id": _ALGOLIA_APP,
        "X-Algolia-API-Key":        _ALGOLIA_KEY,
        "Content-Type":             "application/json",
    }
    hits: list[dict] = []
    page = 0
    while True:
        payload = {
            "query":   "",
            "filters": 'categories.level0:"Flower"',
            "hitsPerPage": 100,
            "page": page,
            "attributesToRetrieve": [
                "name", "brand", "units", "strain_type",
                "thc_percentage", "thcpercentage",
                "price", "product_status", "objectID",
            ],
        }
        resp = requests.post(
            f"{_ALGOLIA_BASE}/{index}/query",
            json=payload,
            headers=headers,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("hits", [])
        hits.extend(batch)
        if page >= data.get("nbPages", 1) - 1:
            break
        page += 1
    return hits


class TrulieveScraper(BaseScraper):
    """Scrapes flower deals from both Trulieve Ocala locations via Algolia."""

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )

        seen: set[str] = set()

        for index in _INDICES:
            try:
                hits = _query_index(index)
                logger.info("  %s → %d flower hits", index, len(hits))
            except Exception as exc:
                logger.warning("Failed to query %s: %s", index, exc)
                continue

            for hit in hits:
                if not hit.get("product_status", True):
                    continue

                obj_id = hit.get("objectID", "")
                if obj_id in seen:
                    continue
                seen.add(obj_id)

                weight = _parse_weight(hit.get("units"))
                if weight is None:
                    continue

                price_usd = hit.get("price", {}).get("USD", {})
                price = price_usd.get("default")
                if price is None:
                    continue

                thc_raw = hit.get("thc_percentage") or hit.get("thcpercentage")
                if isinstance(thc_raw, list) and thc_raw:
                    thc_raw = thc_raw[0]
                thc = BaseScraper.normalize_thc(thc_raw)

                name        = hit.get("name", "Unknown")
                brand       = hit.get("brand") or None
                strain_type = hit.get("strain_type") or "Hybrid"

                result.products.append(FlowerProduct(
                    dispensary_id=self.dispensary_id,
                    product_name=name,
                    weight_grams=weight,
                    price=float(price),
                    strain_type=strain_type,
                    thc_percent=thc,
                    brand=brand,
                    in_stock=True,
                    product_url=f"{PRODUCT_BASE_URL}{obj_id}",
                ))

        logger.info(
            "Trulieve Ocala: %d unique flower products scraped",
            len(result.products),
        )
        return result
