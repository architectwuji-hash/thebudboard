"""
TheBudBoard — Surterra Wellness Ocala scraper.

Platform  : iHeartJane (NOT Dutchie)
Store ID  : 4735
Menu URL  : https://menu.surterra.com/ocala/menu?root_types=flower

Jane exposes a public REST API at api.iheartjane.com.
Products endpoint returns paginated JSON with all the fields we need.
"""
from __future__ import annotations

import logging

import requests

from .base import BaseScraper, FlowerProduct, ScrapeResult

logger = logging.getLogger(__name__)

JANE_STORE_ID = 4735
JANE_API_BASE = "https://api.iheartjane.com/v1"
MENU_URL      = "https://menu.surterra.com/ocala/menu?root_types=flower"

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TheBudBoard-Scraper/1.0)",
    "Accept":     "application/json",
    "Referer":    "https://menu.surterra.com/",
}

# Jane weight/unit label → grams
_WEIGHT_MAP: dict[str, float] = {
    "1g":    1.0,
    "3.5g":  3.5,
    "7g":    7.0,
    "14g":   14.0,
    "28g":   28.0,
    "1/8 oz": 3.5,
    "1/4 oz": 7.0,
    "1/2 oz": 14.0,
    "1 oz":  28.0,
}


def _parse_weight(unit_label: str | None, gram_weight: float | None) -> float | None:
    """Resolve weight from Jane's gram_weight (preferred) or unit label."""
    if gram_weight is not None:
        try:
            return BaseScraper.normalize_weight(float(gram_weight))
        except Exception:
            pass
    if unit_label:
        key = unit_label.strip().lower()
        if key in _WEIGHT_MAP:
            return _WEIGHT_MAP[key]
        return BaseScraper.normalize_weight(unit_label)
    return None


def _fetch_products(store_id: int) -> list[dict]:
    """Fetch all flower products from Jane's store products endpoint."""
    products: list[dict] = []
    page = 1
    per_page = 50

    while True:
        resp = requests.get(
            f"{JANE_API_BASE}/stores/{store_id}/products",
            params={
                "root_types[]": "flower",
                "page":         page,
                "per_page":     per_page,
            },
            headers=_HEADERS,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        items = (
            data.get("data")
            or data.get("products")
            or data.get("items")
            or (data if isinstance(data, list) else [])
        )
        if not items:
            break

        products.extend(items)

        # Jane may not paginate — break if we got fewer than requested
        if len(items) < per_page:
            break
        page += 1

    return products


class SurterraScraper(BaseScraper):
    """Surterra Wellness Ocala — pulls flower products from iHeartJane API."""

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )

        logger.info(
            "Fetching Surterra Ocala from Jane API (store_id=%d)", JANE_STORE_ID
        )

        try:
            items = _fetch_products(JANE_STORE_ID)
        except requests.HTTPError as exc:
            raise RuntimeError(
                f"Jane API returned {exc.response.status_code} for Surterra store {JANE_STORE_ID}"
            ) from exc

        logger.info("  Jane returned %d raw products", len(items))

        for item in items:
            # Jane nests product info — handle both flat and nested shapes
            product = item.get("product") or item
            name    = product.get("name") or item.get("name") or "Unknown"

            # Skip non-flower (should already be filtered but double-check)
            root_type = (product.get("root_type") or item.get("root_type") or "").lower()
            if root_type and "flower" not in root_type:
                continue

            brand = product.get("brand") or item.get("brand_name") or None

            # Strain
            strain_raw = (
                product.get("kind") or item.get("kind")
                or product.get("strain_type") or item.get("strain_type") or ""
            ).lower()
            if "indica" in strain_raw:
                strain = "Indica"
            elif "sativa" in strain_raw:
                strain = "Sativa"
            elif "hybrid" in strain_raw:
                strain = "Hybrid"
            else:
                strain = "Hybrid"

            # THC
            thc_raw = (
                product.get("thc_content_label")
                or item.get("thc_content_label")
                or product.get("percent_thc")
                or item.get("percent_thc")
            )
            thc = BaseScraper.normalize_thc(thc_raw)

            # Image / URL
            image_url   = product.get("image_urls", [None])[0] if product.get("image_urls") else None
            product_url = f"https://www.iheartjane.com/stores/{JANE_STORE_ID}/products/{item.get('id', '')}"

            # Jane may return sizes nested under `items` (each size = separate row)
            # or directly with price/weight at the top level
            price_raw  = item.get("price") or product.get("price")
            weight_raw = item.get("amount") or product.get("amount")  # grams
            unit_label = item.get("unit_label") or product.get("unit_label")

            if price_raw is not None:
                # Single-size product
                weight = _parse_weight(unit_label, weight_raw)
                if weight is not None:
                    result.products.append(FlowerProduct(
                        dispensary_id=self.dispensary_id,
                        product_name=name,
                        weight_grams=weight,
                        price=float(price_raw),
                        strain_type=strain,
                        thc_percent=thc,
                        brand=brand,
                        in_stock=bool(item.get("available", True)),
                        image_url=image_url,
                        product_url=product_url,
                    ))
            else:
                # Try nested sizes
                for size in item.get("sizes") or item.get("variants") or []:
                    p = size.get("price") or size.get("sale_price")
                    w = size.get("amount") or size.get("gram_weight")
                    ul = size.get("unit_label") or unit_label
                    if p is None:
                        continue
                    weight = _parse_weight(ul, w)
                    if weight is None:
                        continue
                    result.products.append(FlowerProduct(
                        dispensary_id=self.dispensary_id,
                        product_name=name,
                        weight_grams=weight,
                        price=float(p),
                        strain_type=strain,
                        thc_percent=thc,
                        brand=brand,
                        in_stock=bool(size.get("available", True)),
                        image_url=image_url,
                        product_url=product_url,
                    ))

        logger.info(
            "Surterra Ocala: %d flower products scraped", len(result.products)
        )
        return result
