"""
TheBudBoard — Base scraper class.
All dispensary scrapers inherit from this.
"""
from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# Standard weight options (grams) we care about
TARGET_WEIGHTS = {1.0, 3.5, 7.0, 14.0, 28.0}

# Terpene → effect mapping (used when effect isn't in the menu)
TERP_EFFECTS: dict[str, str] = {
    "myrcene":       "Relaxing",
    "limonene":      "Energizing",
    "caryophyllene": "Relaxing",
    "terpinolene":   "Energizing",
    "linalool":      "Sleep",
    "pinene":        "Focused",
    "ocimene":       "Focused",
    "humulene":      "Relaxing",
    "bisabolol":     "Sleep",
}


@dataclass
class FlowerProduct:
    """Normalised flower product ready for Supabase insertion."""
    dispensary_id:   str
    product_name:    str
    weight_grams:    float
    price:           float
    strain_type:     str = "Hybrid"          # Indica | Sativa | Hybrid | Unknown
    thc_percent:     Optional[float] = None
    cbd_percent:     Optional[float] = None
    primary_terpene: Optional[str]  = None
    effect:          Optional[str]  = None
    brand:           Optional[str]  = None
    in_stock:        bool = True
    image_url:       Optional[str]  = None
    product_url:     Optional[str]  = None

    def effect_from_terp(self) -> str:
        """Derive an effect tag from the primary terpene."""
        if self.primary_terpene:
            return TERP_EFFECTS.get(self.primary_terpene.lower(), "Relaxing")
        return "Relaxing"

    def to_db_row(self) -> dict:
        return {
            "dispensary_id":   self.dispensary_id,
            "product_name":    self.product_name,
            "strain_type":     self.strain_type,
            "thc_percent":     self.thc_percent,
            "cbd_percent":     self.cbd_percent,
            "weight_grams":    self.weight_grams,
            "price":           self.price,
            "primary_terpene": self.primary_terpene,
            "effect":          self.effect or self.effect_from_terp(),
            "brand":           self.brand,
            "in_stock":        self.in_stock,
            "image_url":       self.image_url,
            "product_url":     self.product_url,
        }


@dataclass
class ScrapeResult:
    dispensary_id:   str
    dispensary_name: str
    products:        list[FlowerProduct] = field(default_factory=list)
    error:           Optional[str] = None
    duration_sec:    float = 0.0

    @property
    def success(self) -> bool:
        return self.error is None


class BaseScraper(ABC):
    """
    Abstract base for all TheBudBoard scrapers.

    Subclasses must implement:
      - scrape() → ScrapeResult
    """

    def __init__(self, dispensary_id: str, dispensary_name: str):
        self.dispensary_id   = dispensary_id
        self.dispensary_name = dispensary_name
        self.logger          = logging.getLogger(
            f"{__name__}.{dispensary_name.replace(' ', '')}"
        )

    @abstractmethod
    def scrape(self) -> ScrapeResult:
        """Fetch and return all flower products for this dispensary."""
        ...

    def run(self) -> ScrapeResult:
        """Wraps scrape() with timing and top-level error handling."""
        start = time.perf_counter()
        try:
            result = self.scrape()
        except Exception as exc:
            self.logger.exception("Unhandled error in scraper")
            result = ScrapeResult(
                dispensary_id=self.dispensary_id,
                dispensary_name=self.dispensary_name,
                error=str(exc),
            )
        result.duration_sec = round(time.perf_counter() - start, 2)
        return result

    @staticmethod
    def normalize_weight(raw: str | float) -> Optional[float]:
        """
        Convert a raw weight string/float to grams.
        Handles: '3.5g', '1/8 oz', '7 g', 28.0, etc.
        Returns None if unrecognised or not in TARGET_WEIGHTS.
        """
        if isinstance(raw, (int, float)):
            g = float(raw)
        else:
            raw = raw.strip().lower()
            if "oz" in raw:
                # Convert oz to grams
                num = raw.replace("oz", "").strip()
                # Handle fractions like '1/8'
                if "/" in num:
                    parts = num.split("/")
                    g = float(parts[0]) / float(parts[1]) * 28.3495
                else:
                    g = float(num) * 28.3495
            else:
                g = float(raw.replace("g", "").replace(",", "").strip())

        # Round to nearest target weight
        closest = min(TARGET_WEIGHTS, key=lambda t: abs(t - g))
        if abs(closest - g) < 0.5:
            return closest
        return None

    @staticmethod
    def normalize_thc(val: str | float | None) -> Optional[float]:
        if val is None:
            return None
        try:
            if isinstance(val, str):
                val = val.replace("%", "").strip()
            return round(float(val), 2)
        except (ValueError, TypeError):
            return None
