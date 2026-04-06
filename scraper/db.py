"""
TheBudBoard — Supabase database client for the scraper.
Uses the service_role key (full write access).
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]   # service_role key
        _client = create_client(url, key)
    return _client


def get_dispensaries() -> list[dict]:
    """Return all active dispensaries with their IDs."""
    result = (
        get_client()
        .table("dispensaries")
        .select("id, name, menu_provider, menu_slug")
        .eq("active", True)
        .execute()
    )
    return result.data or []


def replace_deals_for_dispensary(dispensary_id: str, rows: list[dict]) -> int:
    """
    Atomically replace all flower deals for one dispensary.
    1. Delete old deals for this dispensary
    2. Insert new deals
    Returns number of rows inserted.
    """
    client = get_client()

    # Remove deal_notifications FK references first, then delete deals
    existing = client.table("flower_deals").select("id").eq("dispensary_id", dispensary_id).execute()
    deal_ids = [d["id"] for d in (existing.data or [])]
    if deal_ids:
        client.table("deal_notifications").delete().in_("deal_id", deal_ids).execute()

    # Delete existing deals for this dispensary
    client.table("flower_deals").delete().eq("dispensary_id", dispensary_id).execute()

    if not rows:
        logger.warning("No deals to insert for dispensary_id=%s", dispensary_id)
        return 0

    # Insert in batches of 100 (Supabase row limit per request)
    batch_size = 100
    inserted   = 0
    for i in range(0, len(rows), batch_size):
        batch  = rows[i : i + batch_size]
        result = client.table("flower_deals").insert(batch).execute()
        inserted += len(result.data or [])

    logger.info("Inserted %d deals for dispensary_id=%s", inserted, dispensary_id)
    return inserted


def log_scrape(
    dispensary_id:   str,
    status:          str,       # 'success' | 'error' | 'partial'
    products_found:  int = 0,
    flower_products: int = 0,
    error_message:   Optional[str] = None,
    duration_sec:    float = 0.0,
) -> None:
    try:
        get_client().table("scrape_logs").insert({
            "dispensary_id":   dispensary_id,
            "status":          status,
            "products_found":  products_found,
            "flower_products": flower_products,
            "error_message":   error_message,
            "duration_seconds": duration_sec,
        }).execute()
    except Exception:
        logger.exception("Failed to write scrape log")
