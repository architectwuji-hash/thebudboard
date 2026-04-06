"""
TheBudBoard — SweedPOS base scraper.

SweedPOS is used by Curaleaf, Green Dragon, Goldflower, and others.
It renders products client-side via JavaScript, so Playwright is required.

Usage (subclass this):
    class GreenDragonScraper(SweedPosScraper):
        MENU_URL = "https://www.greendragonco.com/shop/florida/.../menu/flower-XX"

HOW TO FIND THE MENU URL:
  1. Visit the dispensary's menu page in a browser
  2. Filter to "Flower" category
  3. Copy that page URL — it's your MENU_URL
"""
from __future__ import annotations

import logging
import re

from .base import BaseScraper, FlowerProduct, ScrapeResult

logger = logging.getLogger(__name__)

# SweedPOS weight label → grams
_WEIGHT_MAP: dict[str, float] = {
    "1g":     1.0,
    "1 g":    1.0,
    "3.5g":   3.5,
    "3.5 g":  3.5,
    "1/8 oz": 3.5,
    "1/8oz":  3.5,
    "7g":     7.0,
    "7 g":    7.0,
    "1/4 oz": 7.0,
    "1/4oz":  7.0,
    "14g":    14.0,
    "14 g":   14.0,
    "1/2 oz": 14.0,
    "1/2oz":  14.0,
    "28g":    28.0,
    "28 g":   28.0,
    "1 oz":   28.0,
    "1oz":    28.0,
}


def _parse_price(text: str) -> float | None:
    nums = re.findall(r"\d+\.?\d*", re.sub(r"[^\d.]", " ", text))
    return float(nums[0]) if nums else None


def _parse_weight(text: str) -> float | None:
    key = text.strip().lower()
    if key in _WEIGHT_MAP:
        return _WEIGHT_MAP[key]
    return BaseScraper.normalize_weight(text)


def _extract_thc(text: str) -> float | None:
    m = re.search(r"([\d.]+)\s*%?\s*thc", text, re.IGNORECASE)
    return BaseScraper.normalize_thc(m.group(1)) if m else None


class SweedPosScraper(BaseScraper):
    """
    Generic Playwright-based scraper for SweedPOS menus.

    Subclasses MUST set MENU_URL to the flower category page URL.
    If MENU_URL is empty, the scraper returns an empty result with a warning.
    """
    MENU_URL: str = ""   # Override in subclass

    def scrape(self) -> ScrapeResult:
        result = ScrapeResult(
            dispensary_id=self.dispensary_id,
            dispensary_name=self.dispensary_name,
        )

        if not self.MENU_URL:
            self.logger.warning(
                "%s: MENU_URL is not set — cannot scrape. "
                "Set MENU_URL = '<dispensary flower menu URL>' in the subclass.",
                self.dispensary_name,
            )
            return result

        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError(
                "Playwright is required for SweedPOS scrapers. "
                "Run: pip install playwright && playwright install chromium"
            )

        self.logger.info(
            "Launching Playwright for %s → %s", self.dispensary_name, self.MENU_URL
        )

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            )

            page.goto(self.MENU_URL, wait_until="networkidle", timeout=60_000)

            # Dismiss common age-gate / entry modals
            for text in ["I am 21", "I am 18", "Yes, I'm 21", "Yes, I am", "Enter", "Continue"]:
                try:
                    page.click(f"button:has-text('{text}')", timeout=3_000)
                    break
                except Exception:
                    pass

            # Wait for product cards
            page.wait_for_selector(
                "[class*='ProductCard'], [class*='product-card'], [data-testid*='product']",
                timeout=30_000,
            )

            products_raw = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll(
                    '[class*="ProductCard"], [class*="product-card"], [data-testid*="product"]'
                ));
                return cards.map(card => {
                    const text   = card.innerText || '';
                    const name   = (card.querySelector('[class*="name"], [class*="title"], h3, h4') || {}).innerText || '';
                    const brand  = (card.querySelector('[class*="brand"]') || {}).innerText || '';
                    const price  = (card.querySelector('[class*="price"]') || {}).innerText || '';
                    const thc    = (card.querySelector('[class*="thc"], [class*="THC"]') || {}).innerText || '';
                    const weight = (card.querySelector('[class*="weight"], [class*="size"]') || {}).innerText || '';
                    const strain = (card.querySelector('[class*="strain"], [class*="type"]') || {}).innerText || '';
                    const img    = (card.querySelector('img') || {}).src || '';
                    const link   = (card.querySelector('a') || {}).href || '';
                    return {name, brand, price, thc, weight, strain, img, link, text};
                });
            }""")

            browser.close()

        for p_data in products_raw:
            name = (p_data.get("name") or "").strip()
            if not name:
                name = (p_data.get("text") or "")[:60].strip()
            if not name:
                continue

            price = _parse_price(p_data.get("price", ""))
            if price is None:
                continue

            # Weight — try dedicated field, fall back to regex on full text
            weight_text = p_data.get("weight", "").strip()
            if not weight_text:
                m = re.search(
                    r"(1g|3\.5g|7g|14g|28g|1/8\s*oz|1/4\s*oz|1/2\s*oz|1\s*oz)",
                    p_data.get("text", ""), re.IGNORECASE,
                )
                weight_text = m.group(1) if m else ""
            weight = _parse_weight(weight_text) if weight_text else None
            if weight is None:
                continue

            thc = _extract_thc(p_data.get("thc") or p_data.get("text", ""))

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
                product_url=p_data.get("link") or self.MENU_URL,
            ))

        self.logger.info(
            "%s: %d flower variants scraped", self.dispensary_name, len(result.products)
        )
        return result
