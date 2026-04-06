"""
TheBudBoard — Dutchie GraphQL scraper base.

Dutchie powers Curaleaf and Surterra menus in FL.
The GraphQL endpoint is:  https://dutchie.com/graphql
Store slugs are found in the embedded menu iframe URL on the dispensary site.

HOW TO FIND YOUR SLUG:
  1. Visit the dispensary's menu page (e.g., curaleaf.com/locations/...)
  2. Open DevTools → Network → filter 'dutchie'
  3. Look for a request to  dutchie.com/graphql  — copy the 'slug' variable value
  4. Paste it into the DutchieScraper constructor call in the per-dispensary file
"""
from __future__ import annotations

import logging
import time
from typing import Optional

import requests

from .base import BaseScraper, FlowerProduct, ScrapeResult, TARGET_WEIGHTS

logger = logging.getLogger(__name__)

DUTCHIE_GQL = "https://dutchie.com/graphql"

# ── GraphQL query (Dutchie v3 schema) ───────────────────────
# Fetches all flower products for a given dispensary slug.
PRODUCTS_QUERY = """
query GetFlowerProducts($slug: String!) {
  dispensaryBySlug(slug: $slug) {
    id
    name
    products(
      filter: { category: Flower }
      pagination: { limit: 200, offset: 0 }
    ) {
      id
      name
      type
      strainType
      brand { name }
      image
      Prices {
        id
        isDefault
        price
        priceRec
        weight
        weightUnit
        inStock
      }
      THCContent {
        unit
        range
      }
      CBDContent {
        unit
        range
      }
      terpenes {
        terpene {
          name
        }
        unitSymbol
        value
      }
      effects
    }
  }
}
"""


class DutchieScraper(BaseScraper):
    """
    Scrapes a Dutchie-powered dispensary menu via their GraphQL API.
    Works for: Curaleaf, Surterra, and many independents.
    """

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str,
        dutchie_slug:    str,           # e.g. 'curaleaf-ocala'
        base_url:        str = "",      # e.g. 'https://curaleaf.com/shop/...' (for product_url)
    ):
        super().__init__(dispensary_id, dispensary_name)
        self.slug     = dutchie_slug
        self.base_url = base_url

    def scrape(self) -> ScrapeResult:
        self.logger.info("Fetching Dutchie menu for slug=%s", self.slug)

        resp = requests.post(
            DUTCHIE_GQL,
            json={"query": PRODUCTS_QUERY, "variables": {"slug": self.slug}},
            headers={
                "Content-Type": "application/json",
                "User-Agent":   "Mozilla/5.0 (compatible; TheBudBoard-Scraper/1.0)",
                "Accept":       "application/json",
                "Origin":       "https://dutchie.com",
                "Referer":      f"https://dutchie.com/embedded-menu/{self.slug}/products",
            },
            timeout=30,
        )
        resp.raise_for_status()

        data = resp.json()
        if "errors" in data:
            raise RuntimeError(f"Dutchie GraphQL errors: {data['errors']}")

        dispensary_data = (
            (data.get("data") or {})
            .get("dispensaryBySlug") or {}
        )
        raw_products = dispensary_data.get("products") or []
        self.logger.info("Raw products returned: %d", len(raw_products))

        products: list[FlowerProduct] = []

        for prod in raw_products:
            # Only flower
            if (prod.get("type") or "").lower() not in ("flower", "pre-roll"):
                continue

            name        = prod.get("name", "Unknown")
            strain_type = self._map_strain(prod.get("strainType", ""))
            thc         = self._extract_thc(prod.get("THCContent"))
            cbd         = self._extract_thc(prod.get("CBDContent"))
            top_terp    = self._top_terpene(prod.get("terpenes") or [])
            image       = prod.get("image")
            brand_obj   = prod.get("brand") or {}
            brand       = brand_obj.get("name")

            for variant in prod.get("Prices") or []:
                if not variant.get("inStock", True):
                    continue
                price_rec = variant.get("priceRec") or variant.get("price")
                if not price_rec:
                    continue

                raw_weight = variant.get("weight")
                unit       = (variant.get("weightUnit") or "Grams").lower()

                if raw_weight is None:
                    continue

                # Convert to grams
                g: Optional[float] = None
                if "gram" in unit:
                    g = self.normalize_weight(float(raw_weight))
                elif "oz" in unit:
                    g = self.normalize_weight(f"{raw_weight}oz")

                if g is None:
                    continue

                products.append(FlowerProduct(
                    dispensary_id=self.dispensary_id,
                    product_name=name,
                    weight_grams=g,
                    price=float(price_rec),
                    strain_type=strain_type,
                    thc_percent=thc,
                    cbd_percent=cbd,
                    primary_terpene=top_terp,
                    brand=brand,
                    in_stock=True,
                    image_url=image,
                ))

        self.logger.info("Parsed %d flower variants for %s", len(products), self.dispensary_name)
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
            products=products,
        )

    # ── Helpers ─────────────────────────────────────────────

    @staticmethod
    def _map_strain(raw: str) -> str:
        mapping = {
            "indica":      "Indica",
            "sativa":      "Sativa",
            "hybrid":      "Hybrid",
            "indica_dom":  "Indica",
            "sativa_dom":  "Sativa",
            "hybrid_ind":  "Hybrid",
            "hybrid_sat":  "Hybrid",
        }
        return mapping.get(raw.lower(), "Unknown")

    @staticmethod
    def _extract_thc(content: Optional[dict]) -> Optional[float]:
        if not content:
            return None
        rng = content.get("range") or []
        if rng and len(rng) >= 1:
            try:
                val = float(rng[-1])   # take the upper end of range
                # Dutchie returns % as 0–100 already
                return round(val, 2)
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    def _top_terpene(terpenes: list[dict]) -> Optional[str]:
        """Return name of the highest-value terpene."""
        best_val  = -1.0
        best_name = None
        for t in terpenes:
            try:
                val = float(t.get("value") or 0)
            except (TypeError, ValueError):
                val = 0.0
            name = (t.get("terpene") or {}).get("name")
            if name and val > best_val:
                best_val  = val
                best_name = name
        return best_name
