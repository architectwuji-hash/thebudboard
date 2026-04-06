# ── Original 4 dispensaries ──────────────────────────────────
from .curaleaf          import CuraleafScraper
from .surterra          import SurterraScraper
from .trulieve          import TrulieveScraper
from .fluent            import FluentScraper

# ── iHeartJane ───────────────────────────────────────────────
from .muv               import MuvScraper

# ── Dutchie (classic slug-based) ─────────────────────────────
from .ayr               import AyrScraper
from .jungleboys        import JungleBoysScraper

# ── Dutchie Plus (retailerId-based) ──────────────────────────
from .growhealthy       import GrowHealthyScraper
from .planet13          import Planet13Scraper

# ── SweedPOS (Playwright) ─────────────────────────────────────
from .curaleaf_maricamp import CuraleafMaricampScraper
from .greendragon       import GreenDragonScraper
from .goldflower        import GoldflowerScraper

# ── Custom / stub scrapers ────────────────────────────────────
from .rise              import RiseScraper
from .sunnyside         import SunnysideScraper
from .theflowery        import TheFloweryScraper

__all__ = [
    # Original
    "CuraleafScraper",
    "SurterraScraper",
    "TrulieveScraper",
    "FluentScraper",
    # Jane
    "MuvScraper",
    # Dutchie classic
    "AyrScraper",
    "JungleBoysScraper",
    # Dutchie Plus
    "GrowHealthyScraper",
    "Planet13Scraper",
    # SweedPOS
    "CuraleafMaricampScraper",
    "GreenDragonScraper",
    "GoldflowerScraper",
    # Custom / stub
    "RiseScraper",
    "SunnysideScraper",
    "TheFloweryScraper",
]
