"""
TheBudBoard — APScheduler wrapper for Railway.

Runs the scraper every 3 hours.
Railway keeps this process alive as a "worker" service.
"""
import logging
import subprocess
import sys

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval   import IntervalTrigger
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("thebudboard.scheduler")


def run_scrape():
    logger.info("=== Scheduled scrape starting ===")
    result = subprocess.run(
        [sys.executable, "main.py"],
        capture_output=False,
    )
    if result.returncode != 0:
        logger.error("Scraper exited with code %d", result.returncode)
    else:
        logger.info("Scraper completed successfully")


if __name__ == "__main__":
    scheduler = BlockingScheduler()

    scheduler.add_job(
        func=run_scrape,
        trigger=IntervalTrigger(hours=3),
        id="scrape_all",
        name="Scrape all Ocala dispensaries",
        replace_existing=True,
    )

    logger.info("Scheduler started — scraping every 3 hours")
    logger.info("Running initial scrape now...")
    run_scrape()   # Run once immediately on startup

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")
