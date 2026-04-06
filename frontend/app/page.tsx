'use client';

import { useEffect, useState } from 'react';
import Header        from '@/components/Header';
import WeightSelector from '@/components/WeightSelector';
import CategoryCard  from '@/components/CategoryCard';
import DealModal     from '@/components/DealModal';
import type { Deal, DealsResponse, WeightKey } from '@/lib/types';

const CATEGORIES = ['cheapest', 'budget20', 'highestThc'] as const;

export default function Home() {
  const [data,     setData]     = useState<DealsResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [weight,   setWeight]   = useState<WeightKey>('3.5');
  const [selected, setSelected] = useState<Deal | null>(null);

  useEffect(() => {
    fetch('/api/deals')
      .then((r) => r.json())
      .then((d: DealsResponse) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#080e08',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            16,
      }}>
        <span style={{ fontSize: 40 }}>🌿</span>
        <div style={{ color: '#2a5a2a', fontFamily: 'monospace', letterSpacing: 3, fontSize: 12 }}>
          LOADING DEALS...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#080e08',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            16,
        padding:        20,
        textAlign:      'center',
      }}>
        <span style={{ fontSize: 40 }}>⚠️</span>
        <div style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 14 }}>
          Could not load deals right now.
        </div>
        <div style={{ color: '#2a4a2a', fontFamily: 'monospace', fontSize: 11 }}>
          {error ?? 'Unknown error'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop:    8,
            padding:      '10px 24px',
            borderRadius: 10,
            border:       '1px solid #2a5a2a',
            background:   '#0f1f0f',
            color:        '#4ade80',
            cursor:       'pointer',
            fontFamily:   'monospace',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const currentDeals = data.deals[weight];

  return (
    <div style={{ minHeight: '100vh', background: '#080e08', paddingBottom: 60 }}>
      <Header
        dispensaries={data.dispensaries}
        lastUpdated={data.lastUpdated}
      />

      <WeightSelector selected={weight} onChange={setWeight} />

      <div style={{ padding: '12px 16px 0' }}>
        {currentDeals
          ? CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat}
                catKey={cat}
                deal={currentDeals[cat]}
                weight={weight}
                onSelect={setSelected}
              />
            ))
          : (
            <div style={{ color: '#2a4a2a', fontFamily: 'monospace', textAlign: 'center', paddingTop: 40 }}>
              No deals found for this weight. Check back soon.
            </div>
          )
        }
      </div>

      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#182818', fontFamily: 'monospace', lineHeight: 2.2, letterSpacing: 1 }}>
          THEBUDBOARD.COM · FOR MEDICAL PATIENTS ONLY<br />
          PURCHASES MADE DIRECTLY WITH DISPENSARIES<br />
          NOT AFFILIATED WITH ANY DISPENSARY · DEALS UPDATED EVERY 3 HOURS
        </div>
      </div>

      {selected && (
        <DealModal
          deal={selected}
          weight={weight}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
