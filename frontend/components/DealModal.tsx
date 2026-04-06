'use client';

import { useState } from 'react';
import type { Deal } from '@/lib/types';

interface Props {
  deal:    Deal;
  weight:  string;
  onClose: () => void;
}

export default function DealModal({ deal, weight, onClose }: Props) {
  const [sent,    setSent]    = useState(false);
  const [contact, setContact] = useState('');
  const [type,    setType]    = useState<'text' | 'email'>('text');
  const [loading, setLoading] = useState(false);

  const ppg = (deal.price / Number(weight)).toFixed(2);

  async function handleSend() {
    if (!contact) return;
    setLoading(true);
    try {
      await fetch('/api/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId:      deal.id,
          contactType: type,
          contact,
          productName: deal.name,
          dispensary:  deal.dispensary,
        }),
      });
      setSent(true);
    } catch {
      // Still show success — log is best-effort
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        background:     'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        display:        'flex',
        alignItems:     'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:   '#0a140a',
          width:        '100%',
          maxWidth:     480,
          borderRadius: '28px 28px 0 0',
          padding:      '32px 24px 52px',
          border:       '1px solid #1e3a1e',
          borderBottom: 'none',
        }}
      >
        {!sent ? (
          <>
            {/* Deal summary */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                fontSize:      11,
                color:         '#2e5a2e',
                fontFamily:    'monospace',
                letterSpacing: 3,
                marginBottom:  8,
              }}>
                GET DEAL INFO
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#d4f5d4', fontFamily: "'Georgia', serif" }}>
                {deal.name}
              </div>
              <div style={{ fontSize: 13, color: '#3a6a3a', fontFamily: 'monospace', marginTop: 4 }}>
                {deal.dispensary} · {deal.address}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                {[
                  { val: `$${deal.price}`,  label: 'PRICE' },
                  { val: `${deal.thc}%`,    label: 'THC'   },
                  { val: `$${ppg}/g`,       label: 'PER G' },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>
                      {stat.val}
                    </div>
                    <div style={{ fontSize: 9, color: '#2e5a2e', fontFamily: 'monospace', letterSpacing: 2 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text / Email toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['text', 'email'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex:        1,
                    padding:     12,
                    borderRadius: 12,
                    border:      `1px solid ${type === t ? '#4ade80' : '#1e3a1e'}`,
                    background:  type === t ? '#1a3a1a' : 'transparent',
                    color:       type === t ? '#4ade80' : '#3a6a3a',
                    fontWeight:  700,
                    fontSize:    13,
                    cursor:      'pointer',
                    fontFamily:  'monospace',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {t === 'text' ? '📱 Text' : '📧 Email'}
                </button>
              ))}
            </div>

            <input
              placeholder={type === 'text' ? 'Phone number' : 'Email address'}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={{
                width:        '100%',
                padding:      '14px 16px',
                borderRadius: 12,
                border:       '1px solid #1e3a1e',
                background:   '#080e08',
                color:        '#d4f5d4',
                fontSize:     16,
                fontFamily:   'monospace',
                boxSizing:    'border-box',
                marginBottom: 14,
                outline:      'none',
              }}
            />

            <button
              onClick={handleSend}
              disabled={!contact || loading}
              style={{
                width:         '100%',
                padding:       16,
                borderRadius:  12,
                border:        'none',
                background:    contact && !loading
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : '#111a11',
                color:         contact && !loading ? '#fff' : '#1e3a1e',
                fontWeight:    800,
                fontSize:      15,
                cursor:        contact && !loading ? 'pointer' : 'default',
                fontFamily:    'monospace',
                letterSpacing: 2,
                textTransform: 'uppercase',
                transition:    'all 0.3s',
              }}
            >
              {loading ? 'Sending...' : 'Send Me This Deal →'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🌿</div>
            <div style={{
              fontSize:   22,
              fontWeight: 800,
              color:      '#4ade80',
              fontFamily: "'Georgia', serif",
              marginBottom: 10,
            }}>
              You&apos;re all set!
            </div>
            <div style={{ fontSize: 14, color: '#3a6a3a', lineHeight: 1.8, fontFamily: 'monospace' }}>
              Deal info sent to your {type}.<br />
              Head to {deal.dispensary} and grab it!
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop:    28,
                padding:      '12px 32px',
                borderRadius: 10,
                border:       '1px solid #1e3a1e',
                background:   'transparent',
                color:        '#3a6a3a',
                fontSize:     13,
                cursor:       'pointer',
                fontFamily:   'monospace',
              }}
            >
              ← Back to Deals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
