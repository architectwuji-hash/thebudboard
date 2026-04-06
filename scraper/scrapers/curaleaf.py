"""
TheBudBoard — Curaleaf Ocala scraper.

Platform  : SweedPOS (NOT Dutchie)
Store ID  : 40
Category  : Flower, categoryId=68
Menu URL  : https://curaleaf.com/shop/florida/curaleaf-dispensary-ocala/menu/flower-68

SweedPOS renders products client-side via JavaScript, so we use
Playwright to load the page and extract data from the DOM.

Product cards expose data attributes and text we can parse directly.
"""
from __future__ import annotations

import logging
import re

from .base import BaseScraper, FlowerProduct, ScrapeResult

logger = logging.getLogger(__name__)

CURALEAF_STORE_ID   = 40
CURALEAF_CATEGORY_ID = 68
MENU_URL = (
    "https://curaleaf.com/shop/florida/curaleaf-dispensary-ocala"
    f"/menu/flower-{CURALEAF_CATEGORY_ID}"
)

# SweedPOS weight label → grams
_WEIGHT_MAP: dict[str, float] = {
    "1g":    1.0,
    "1 g":   1.0,
    "3.5g":  3.5,
    "3.5 g": 3.5,
    "1/8 oz":  3.5,
    "1/8oz":   3.5,
    "7g":    7.0,
    "7 g":   7.0,
    "1/4 oz":  7.0,
    "1/4oz":   7.0,
    "14g":   14.0,
    "14 g":  14.0,
    "1/2 oz": 14.0,
    "1/2oz":  14.0,
    "28g":   28.0,
    "28 g":  28.0,
    "1 oz":  28.0,
    "1oz":   28.0,
}


def _parse_weight(text: str) -> float | None:
    key = text.strip().lower()
    if key in _WEIGHT_MAP:
        return _WEIGHT_MAP[key]
    return BaseScraper.normalize_weight(text)


def _extract_thc(text: str) -> float | None:
    """Pull first numeric THC value from a string like '22.5% THC'."""
    m = re.search(r"([\d.]+)\s*%?\s*thc", text, re.IGNORECASE)
    return BaseScraper.normalize_thc(m.group(1)) if m else None


class CuraleafScraper(BaseScraper):
    """Curaleaf Ocala — uses Playwright to scrape the SweedPOS menu."""

    def scrape(self) -> ScrapeResult:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError(
                "Playwright is required for Curaleaf. "
                "Run: pip install playwright && playwright install chromium"
            )

        result = ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )

        logger.info("Launching Playwright for Curaleaf Ocala → %s", MENU_URL)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            )

            # Navigate and wait for product cards to render
            page.goto(MENU_URL, wait_until="networkidle", timeout=60_000)

            # Accept any age-gate modal if present
            try:
                page.click("button:has-text('I am 18')", timeout=5_000)
            except Exception:
                pass
            try:
                page.click("button:has-text('Enter')", timeout=3_000)
            except Exception:
                pass

            # Wait for product cards
            page.wait_for_selector(
                "[class*='ProductCard'], [class*='product-card'], [data-testid*='product']",
                timeout=30_000,
            )

            products = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll(
                    '[class*="ProductCard"], [class*="product-card"], [data-testid*="product"]'
                ));
                return cards.map(card => {
                    const text  = card.innerText || '';
                    const name  = (card.querySelector('[class*="name"], [class*="title"], h3, h4') || {}).innerText || '';
                    const brand = (card.querySelector('[class*="brand"]') || {}).innerText || '';
                    const price = (card.querySelector('[class*="price"]') || {}).innerText || '';
                    const thc   = (card.querySelector('[class*="thc"], [class*="THC"]') || {}).innerText || '';
                    const weight= (card.querySelector('[class*="weight"], [class*="size"]') || {}).innerText || '';
                    const strain= (card.querySelector('[class*="strain"], [class*="type"]') || {}).innerText || '';
                    const img   = (card.querySelector('img') || {}).src || '';
                    const link  = (card.querySelector('a') || {}).href || '';
                    return {name, brand, price, thc, weight, strain, img, link, text};
                });
            }""")

            browser.close()

        for p_data in products:
            name = (p_data.get("name") or "").strip()
            if not name:
                # Fall back to extracting from full text
                name = (p_data.get("text") or "")[:60].strip()

            # Price — strip $ and commas, take first number
            price_str = re.sub(r"[^\d.]", " ", p_data.get("price", ""))
            price_nums = re.findall(r"\d+\.?\d*", price_str)
            if not price_nums:
                continue
            price = float(price_nums[0])

            # Weight
            weight_text = p_data.get("weight") or ""
            # Try extracting from full card text if dedicated field empty
            if not weight_text:
                m = re.search(
                    r"(1g|3\.5g|7g|14g|28g|1/8\s*oz|1/4\s*oz|1/2\s*oz|1\s*oz)",
                    p_data.get("text", ""), re.IGNORECASE
                )
                weight_text = m.group(1) if m else ""
            weight = _parse_weight(weight_text) if weight_text else None
            if weight is None:
                continue

            # THC
            thc_text = p_data.get("thc") or p_data.get("text", "")
            thc = _extract_thc(thc_text)

            # Strain type
            strain_raw = (p_data.get("strain") or "").lower()
            if "indica" in strain_raw:
                strain = "Indica"
            elif "sativa" in strain_raw:
                strain = "Sativa"
            else:
                strain = "Hybrid"

            result.products.append(FlowerProduct(
                dispensary_id=self.dispensary_id,
                product_name=name,
                weight_grams=weight,
                price=price,
                strain_type=strain,
                thc_percent=thc,
                brand=p_data.get("brand") or None,
                in_stock=True,
                image_url=p_data.get("img") or None,
                product_url=p_data.get("link") or MENU_URL,
            ))

        logger.info(
            "Curaleaf Ocala: %d flower products scraped", len(result.products)
        )
        return result
