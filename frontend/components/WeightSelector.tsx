'use client';

import type { WeightKey } from '@/lib/types';

const WEIGHTS: { key: WeightKey; label: string }[] = [
  { key: '1',   label: '1g'   },
  { key: '3.5', label: '3.5g' },
  { key: '7',   label: '7g'   },
  { key: '14',  label: '14g'  },
  { key: '28',  label: '28g'  },
];

interface Props {
  selected:  WeightKey;
  onChange:  (w: WeightKey) => void;
}

export default function WeightSelector({ selected, onChange }: Props) {
  return (
    <div style={{ padding: '20px 16px 8px' }}>
      <div style={{
        fontSize:      10,
        color:         '#2a4a2a',
        fontFamily:    'monospace',
        letterSpacing: 3,
        marginBottom:  10,
        textTransform: 'uppercase',
      }}>
        Select Weight
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {WEIGHTS.map((w) => {
          const active = selected === w.key;
          return (
            <button
              key={w.key}
              onClick={() => onChange(w.key)}
              style={{
                flex:        1,
                padding:     '10px 0',
                borderRadius: 10,
                border:      `1px solid ${active ? '#2a5a2a' : '#182818'}`,
                background:  active ? '#1a3a1a' : '#0f180f',
                color:       active ? '#4ade80' : '#2a4a2a',
                fontWeight:  active ? 800 : 500,
                fontSize:    13,
                cursor:      'pointer',
                fontFamily:  'monospace',
                transition:  'all 0.2s',
              }}
            >
              {w.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
