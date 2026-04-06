'use client';

interface HeaderProps {
  dispensaries:  string[];
  lastUpdated:   string;   // ISO string
}

function timeUntilNextUpdate(lastUpdated: string): string {
  const INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
  const last        = new Date(lastUpdated).getTime();
  const nextAt      = last + INTERVAL_MS;
  const remaining   = nextAt - Date.now();
  if (remaining <= 0) return 'updating soon';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Header({ dispensaries, lastUpdated }: HeaderProps) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });

  const dispStr =
    dispensaries.length > 0
      ? dispensaries.join(' · ')
      : 'Trulieve · Curaleaf · Surterra · Fluent';

  return (
    <div style={{
      background:   'linear-gradient(180deg, #0d1f0d, #080e08)',
      padding:      '40px 20px 20px',
      borderBottom: '1px solid #182818',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 30 }}>🌿</span>
        <div>
          <div style={{
            fontSize:    26,
            fontWeight:  900,
            color:       '#d4f5d4',
            fontFamily:  "'Georgia', serif",
            lineHeight:  1,
          }}>
            TheBudBoard
          </div>
          <div style={{
            fontSize:    10,
            color:       '#2a5a2a',
            fontFamily:  'monospace',
            letterSpacing: 3,
          }}>
            OCALA · MEDICAL FLOWER
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#1e3a1e', fontFamily: 'monospace' }}>
        📅 {dateStr}
      </div>
      <div style={{ fontSize: 11, color: '#1e3a1e', fontFamily: 'monospace', marginTop: 2 }}>
        🏪 {dispStr}
      </div>

      <div style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          6,
        marginTop:    10,
        padding:      '5px 12px',
        borderRadius: 20,
        background:   '#0f1f0f',
        border:       '1px solid #1e3a1e',
      }}>
        <span style={{ fontSize: 10 }}>🔄</span>
        <span style={{ fontSize: 10, color: '#4ade80', fontFamily: 'monospace', letterSpacing: 1 }}>
          Next update in {timeUntilNextUpdate(lastUpdated)}
        </span>
      </div>
    </div>
  );
}
