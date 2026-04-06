"""
TheBudBoard — Dutchie Plus (DfB) GraphQL scraper base.

Dutchie Plus is the newer Dutchie platform used by GrowHealthy, Planet 13,
and other larger MSOs. It differs from classic Dutchie in two ways:
  1. Uses a UUID retailerId instead of a text slug
  2. Uses a different GraphQL query: filteredMenu vs dispensaryBySlug

API endpoint is the same: https://dutchie.com/graphql
No auth required for public embedded-menu reads.

HOW TO FIND YOUR retailerId:
  1. Visit the dispensary's menu page in your browser
  2. Open DevTools → Network → filter "dutchie.com/graphql"
  3. Look at the POST request body → variables → find "retailerId"
  4. It will be a UUID like "c50c3985-4ddb-43d4-9f67-f5e6665d58d8"

TROUBLESHOOTING:
  If this scraper returns 0 products or errors, open the dispensary's
  menu page in Chrome DevTools and check what GraphQL operation name is
  used (it may differ from "TheBudBoardFilteredMenu"). Update OPERATION_NAME
  and/or the query fields accordingly.
"""
from __future__ import annotations

import logging
from typing import Optional

import requests

from .base import BaseScraper, FlowerProduct, ScrapeResult, TARGET_WEIGHTS

logger = logging.getLogger(__name__)

DUTCHIE_GQL    = "https://dutchie.com/graphql"
OPERATION_NAME = "TheBudBoardFilteredMenu"

# Dutchie Plus uses MEDICAL menus for FL dispensaries
MENU_TYPE = "MEDICAL"

# GraphQL query for Dutchie Plus embedded menus (retailerId-based)
PLUS_QUERY = """
query TheBudBoardFilteredMenu(
  $retailerId: ID!
  $menuType: MenuType
  $filter: FilterInput
  $pagination: PaginationInput
) {
  filteredMenu(
    retailerId: $retailerId
    menuType: $menuType
    filter: $filter
    paginationInput: $pagination
  ) {
    products {
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
      THCContent { unit range }
      CBDContent { unit range }
      terpenes {
        terpene { name }
        value
        unitSymbol
      }
    }
  }
}
"""


class DutchiePlusScraper(BaseScraper):
    """
    Scrapes a Dutchie Plus (DfB) dispensary menu via their GraphQL API.
    Works for: GrowHealthy, Planet 13, and other Dutchie Plus retailers.
    """

    def __init__(
        self,
        dispensary_id:   str,
        dispensary_name: str,
        retailer_id:     str,       # UUID, e.g. "c50c3985-4ddb-43d4-9f67-f5e6665d58d8"
        menu_url:        str = "",  # Dispensary flower menu URL (for logging / product_url)
    ):
        super().__init__(dispensary_id, dispensary_name)
        self.retailer_id = retailer_id
        self.menu_url    = menu_url

    def scrape(self) -> ScrapeResult:
        self.logger.info(
            "Fetching Dutchie Plus menu for retailerId=%s (%s)",
            self.retailer_id, self.dispensary_name,
        )

        payload = {
            "operationName": OPERATION_NAME,
            "query":         PLUS_QUERY,
            "variables": {
                "retailerId": self.retailer_id,
                "menuType":   MENU_TYPE,
                "filter":     {"category": "Flower"},
                "pagination": {"limit": 200, "offset": 0},
            },
        }

        resp = requests.post(
            DUTCHIE_GQL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent":   "Mozilla/5.0 (compatible; TheBudBoard-Scraper/1.0)",
                "Accept":       "application/json",
                "Origin":       "https://dutchie.com",
                "Referer":      (
                    self.menu_url
                    or f"https://dutchie.com/embedded-menu/{self.retailer_id}/products"
                ),
            },
            timeout=30,
        )
        resp.raise_for_status()

        data = resp.json()

        if "errors" in data:
            # Log the error details to help with debugging
            self.logger.error(
                "Dutchie Plus GraphQL errors for %s: %s",
                self.dispensary_name, data["errors"],
            )
            self.logger.error(
                "HINT: Open the dispensary's menu page in Chrome DevTools → Network → "
                "filter 'dutchie.com/graphql' to see the actual query/operation being used, "
                "then update dutchie_plus.py accordingly."
            )
            raise RuntimeError(f"Dutchie Plus GraphQL errors: {data['errors']}")

        raw_products = (
            (data.get("data") or {})
            .get("filteredMenu", {})
            .get("products") or []
        )
        self.logger.info("Raw products returned: %d", len(raw_products))

        products: list[FlowerProduct] = []

        for prod in raw_products:
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
                price_val = variant.get("priceRec") or variant.get("price")
                if not price_val:
                    continue

                raw_weight = variant.get("weight")
                unit       = (variant.get("weightUnit") or "Grams").lower()

                if raw_weight is None:
                    continue

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
                    price=float(price_val),
                    strain_type=strain_type,
                    thc_percent=thc,
                    cbd_percent=cbd,
                    primary_terpene=top_terp,
                    brand=brand,
                    in_stock=True,
                    image_url=image,
                    product_url=self.menu_url or None,
                ))

        self.logger.info(
            "Parsed %d flower variants for %s", len(products), self.dispensary_name
        )
        return ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
            products=products,
        )

    # ── Helpers (shared with classic DutchieScraper) ─────────
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
        return mapping.get((raw or "").lower(), "Unknown")

    @staticmethod
    def _extract_thc(content: Optional[dict]) -> Optional[float]:
        if not content:
            return None
        rng = content.get("range") or []
        if rng and len(rng) >= 1:
            try:
                return round(float(rng[-1]), 2)
            except (ValueError, TypeError):
                pass
        return None

    @staticmethod
    def _top_terpene(terpenes: list[dict]) -> Optional[str]:
        best_val, best_name = -1.0, None
        for t in terpenes:
            try:
                val = float(t.get("value") or 0)
            except (TypeError, ValueError):
                val = 0.0
            name = (t.get("terpene") or {}).get("name")
            if name and val > best_val:
                best_val, best_name = val, name
        return best_name
