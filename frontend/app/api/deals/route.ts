import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Deal, DealsForWeight, WeightKey, DealsResponse } from '@/lib/types';

// Cache this route for 3 minutes (revalidate on demand via scraper webhook)
export const revalidate = 180;

const WEIGHTS: WeightKey[] = ['1', '3.5', '7', '14', '28'];

// Terpene → effect mapping (fallback when DB has no effect column)
const TERP_EFFECT: Record<string, string> = {
  Myrcene:       'Relaxing',
  Limonene:      'Energizing',
  Caryophyllene: 'Relaxing',
  Terpinolene:   'Energizing',
  Linalool:      'Sleep',
  Pinene:        'Focused',
  Ocimene:       'Focused',
  Humulene:      'Relaxing',
  Bisabolol:     'Sleep',
};

function rowToDeal(row: any): Deal {
  return {
    id:           row.id,
    name:         row.product_name,
    strain:       row.strain_type ?? 'Hybrid',
    thc:          Number(row.thc_percent ?? 0),
    price:        Number(row.price),
    pricePerGram: Number(row.price_per_gram ?? 0),
    dispensary:   row.dispensary_name,
    address:      row.dispensary_address ?? '',
    terp:         row.primary_terpene ?? 'Myrcene',
    effect:       row.effect ?? TERP_EFFECT[row.primary_terpene ?? ''] ?? 'Relaxing',
    imageUrl:     row.image_url,
    productUrl:   row.product_url,
  };
}

export async function GET() {
  try {
    // Pull all in-stock flower deals from the last 8 hours via the view
    const { data, error } = await supabase
      .from('best_deals_by_weight')
      .select('*')
      .order('weight_grams', { ascending: true })
      .order('price', { ascending: true });

    if (error) throw error;

    const deals: Partial<Record<WeightKey, DealsForWeight>> = {};
    const dispensarySet = new Set<string>();

    for (const w of WEIGHTS) {
      const rows = (data ?? []).filter(
        (r: any) => Number(r.weight_grams) === Number(w)
      );

      if (rows.length === 0) continue;

      rows.forEach((r: any) => dispensarySet.add(r.dispensary_name));

      // Cheapest (rank 1 by price)
      const cheapestRow = rows.find((r: any) => r.price_rank === 1) ?? rows[0];

      // Cheapest with 20%+ THC
      const budget20Row =
        rows.find((r: any) => r.budget20_rank === 1 && r.thc_percent >= 20) ??
        rows.find((r: any) => r.thc_percent >= 20) ??
        rows[0];

      // Highest THC (rank 1 by thc)
      const highestThcRow = rows.find((r: any) => r.thc_rank === 1) ?? rows[rows.length - 1];

      deals[w] = {
        cheapest:   rowToDeal(cheapestRow),
        budget20:   rowToDeal(budget20Row),
        highestThc: rowToDeal(highestThcRow),
      };
    }

    // Most recent scrape timestamp
    const lastUpdated =
      data && data.length > 0
        ? data.reduce((latest: string, r: any) =>
            r.scraped_at > latest ? r.scraped_at : latest,
            data[0].scraped_at
          )
        : new Date().toISOString();

    const response: DealsResponse = {
      deals:        deals as Record<WeightKey, DealsForWeight>,
      lastUpdated,
      dispensaries: [...dispensarySet],
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60' },
    });
  } catch (err: any) {
    console.error('[/api/deals] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
