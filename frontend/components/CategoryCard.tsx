'use client';

import type { Deal, CategoryKey } from '@/lib/types';

const CATEGORIES: Record<CategoryKey, { icon: string; label: string; sub: string }> = {
  cheapest:   { icon: '💵', label: 'Cheapest',      sub: 'Lowest price, period'       },
  budget20:   { icon: '⚡', label: 'Cheapest 20%+', sub: 'Budget · min 20% THC'       },
  highestThc: { icon: '🔥', label: 'Highest THC',   sub: 'Max potency available'      },
};

const EFFECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Relaxing:   { bg: '#1a3a2a', text: '#6ee7b7', border: '#2a5a3a' },
  Uplifting:  { bg: '#3a3a1a', text: '#fde68a', border: '#5a5a2a' },
  Creative:   { bg: '#2a1a3a', text: '#c4b5fd', border: '#3a2a5a' },
  Energizing: { bg: '#3a1a1a', text: '#fca5a5', border: '#5a2a2a' },
  Sleep:      { bg: '#1a2a3a', text: '#93c5fd', border: '#2a3a5a' },
  Euphoric:   { bg: '#3a1a2a', text: '#f9a8d4', border: '#5a2a3a' },
  Focused:    { bg: '#1a3a1a', text: '#86efac', border: '#2a5a2a' },
};

const STRAIN_COLORS: Record<string, { color: string; icon: string }> = {
  Indica:  { color: '#a78bfa', icon: '🟣' },
  Sativa:  { color: '#fb923c', icon: '🟠' },
  Hybrid:  { color: '#4ade80', icon: '🟢' },
  Unknown: { color: '#9ca3af', icon: '⚪' },
};

interface Props {
  catKey:   CategoryKey;
  deal:     Deal;
  weight:   string;
  onSelect: (deal: Deal) => void;
}

export default function CategoryCard({ catKey, deal, weight, onSelect }: Props) {
  const cat = CATEGORIES[catKey];
  const ec  = EFFECT_COLORS[deal.effect] ?? EFFECT_COLORS.Relaxing;
  const sc  = STRAIN_COLORS[deal.strain]  ?? STRAIN_COLORS.Unknown;
  const ppg = (deal.price / Number(weight)).toFixed(2);

  return (
    <div style={{
      background:   'linear-gradient(160deg, #0f1a0f, #080e08)',
      borderRadius: 18,
      padding:      '18px',
      marginBottom: 12,
      border:       '1px solid #182818',
      boxShadow:    '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      {/* Category label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{cat.icon}</span>
        <div>
          <div style={{
            fontSize:      11,
            fontWeight:    800,
            color:         '#4ade80',
            fontFamily:    'monospace',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {cat.label}
          </div>
          <div style={{ fontSize: 9, color: '#2a4a2a', fontFamily: 'monospace', letterSpacing: 1 }}>
            {cat.sub}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#182818', marginBottom: 12 }} />

      {/* Product info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: sc.color, fontFamily: 'monospace' }}>
              {sc.icon} {deal.strain}
            </span>
          </div>
          <div style={{
            fontSize:   18,
            fontWeight: 800,
            color:      '#d4f5d4',
            fontFamily: "'Georgia', serif",
            lineHeight: 1.2,
          }}>
            {deal.name}
          </div>
          <div style={{ fontSize: 11, color: '#2a4a2a', fontFamily: 'monospace', marginTop: 2 }}>
            {deal.dispensary}
          </div>
        </div>

        <div style={{ textAlign: 'right', marginLeft: 12 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1 }}>
            ${deal.price}
          </div>
          <div style={{ fontSize: 10, color: '#2a5a2a', fontFamily: 'monospace' }}>
            ${ppg}/g
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#86efac', fontFamily: 'monospace', marginTop: 2 }}>
            {deal.thc}% THC
          </div>
        </div>
      </div>

      {/* Effect + Terpene tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{
          background:   ec.bg,
          color:        ec.text,
          border:       `1px solid ${ec.border}`,
          padding:      '3px 9px',
          borderRadius: 20,
          fontSize:     10,
          fontFamily:   'monospace',
        }}>
          {deal.effect}
        </span>
        <span style={{
          background:   '#0f1a0f',
          color:        '#2a5a2a',
          border:       '1px solid #182818',
          padding:      '3px 9px',
          borderRadius: 20,
          fontSize:     10,
          fontFamily:   'monospace',
        }}>
          🌱 {deal.terp}
        </span>
      </div>

      <button
        onClick={() => onSelect(deal)}
        style={{
          width:         '100%',
          padding:       '12px',
          borderRadius:  10,
          border:        '1px solid #2a5a2a',
          background:    '#0f1f0f',
          color:         '#4ade80',
          fontWeight:    700,
          fontSize:      12,
          cursor:        'pointer',
          fontFamily:    'monospace',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        Get Deal Info →
      </button>
    </div>
  );
}
