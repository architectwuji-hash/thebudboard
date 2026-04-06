"""
TheBudBoard — MÜV Ocala scraper.

Platform  : iHeartJane (same as Surterra)
Store ID  : 316
Menu URL  : https://muvfl.com/locations/ocala (ordering via Jane embed)

Jane exposes a public REST API at api.iheartjane.com.
This scraper is structurally identical to surterra.py with a different store ID.
"""
from __future__ import annotations

import logging

import requests

from .base import BaseScraper, FlowerProduct, ScrapeResult

logger = logging.getLogger(__name__)

JANE_STORE_ID = 316
JANE_API_BASE = "https://api.iheartjane.com/v1"
MENU_URL      = "https://muvfl.com/locations/ocala"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":             "application/json, text/plain, */*",
    "Accept-Language":    "en-US,en;q=0.9",
    "Origin":             "https://muvfl.com",
    "Referer":            "https://muvfl.com/",
    "sec-ch-ua":          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile":   "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest":     "empty",
    "sec-fetch-mode":     "cors",
    "sec-fetch-site":     "cross-site",
}

_WEIGHT_MAP: dict[str, float] = {
    "1g":     1.0,
    "3.5g":   3.5,
    "7g":     7.0,
    "14g":    14.0,
    "28g":    28.0,
    "1/8 oz": 3.5,
    "1/4 oz": 7.0,
    "1/2 oz": 14.0,
    "1 oz":   28.0,
}


def _parse_weight(unit_label: str | None, gram_weight: float | None) -> float | None:
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
        if len(items) < per_page:
            break
        page += 1

    return products


class MuvScraper(BaseScraper):
    """MÜV Ocala — pulls flower products from iHeartJane API (storeId=316)."""

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )

        logger.info("Fetching MÜV Ocala from Jane API (store_id=%d)", JANE_STORE_ID)

        try:
            items = _fetch_products(JANE_STORE_ID)
        except requests.HTTPError as exc:
            raise RuntimeError(
                f"Jane API returned {exc.response.status_code} for MÜV store {JANE_STORE_ID}"
            ) from exc

        logger.info("  Jane returned %d raw products", len(items))

        for item in items:
            product = item.get("product") or item
            name    = product.get("name") or item.get("name") or "Unknown"

            root_type = (product.get("root_type") or item.get("root_type") or "").lower()
            if root_type and "flower" not in root_type:
                continue

            brand = product.get("brand") or item.get("brand_name") or None

            strain_raw = (
                product.get("kind") or item.get("kind")
                or product.get("strain_type") or item.get("strain_type") or ""
            ).lower()
            if "indica" in strain_raw:
                strain = "Indica"
            elif "sativa" in strain_raw:
                strain = "Sativa"
            else:
                strain = "Hybrid"

            thc_raw = (
                product.get("thc_content_label")
                or item.get("thc_content_label")
                or product.get("percent_thc")
                or item.get("percent_thc")
            )
            thc = BaseScraper.normalize_thc(thc_raw)

            image_url   = product.get("image_urls", [None])[0] if product.get("image_urls") else None
            product_url = f"https://www.iheartjane.com/stores/{JANE_STORE_ID}/products/{item.get('id', '')}"

            price_raw  = item.get("price") or product.get("price")
            weight_raw = item.get("amount") or product.get("amount")
            unit_label = item.get("unit_label") or product.get("unit_label")

            if price_raw is not None:
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

        logger.info("MÜV Ocala: %d flower products scraped", len(result.products))
        return result
