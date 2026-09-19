/**
 * All gameplay and presentation constants live here.
 * Logic and render modules read from CONFIG — no magic numbers elsewhere.
 */
export const CONFIG = {
  BASE: {
    maxHp: 100,
    radius: 56,
    fill: '#2563eb',
    stroke: '#93c5fd',
    strokeWidth: 3,
    hpFont: 'bold 22px system-ui, sans-serif',
    hpColor: '#ffffff',
  },

  PLAYER: {
    radius: 22,
    fill: '#22c55e',
    stroke: '#bbf7d0',
    strokeWidth: 2,
    /** World-units per second. */
    speed: 240,
    /** Spawn offset from base center (pixels). */
    startOffsetX: 90,
    startOffsetY: 0,
  },

  CANVAS: {
    background: '#0f172a',
  },

  HUD: {
    label: 'Base HP',
    font: '600 18px system-ui, sans-serif',
    color: '#e2e8f0',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    paddingX: 16,
    paddingY: 16,
  },

  /** Left-half touch zone virtual joystick (mobile). */
  JOYSTICK: {
    zoneWidthRatio: 0.5,
    maxRadius: 72,
    baseFill: 'rgba(148, 163, 184, 0.25)',
    baseStroke: 'rgba(148, 163, 184, 0.5)',
    stickFill: 'rgba(226, 232, 240, 0.85)',
    stickStroke: 'rgba(15, 23, 42, 0.35)',
    stickRadius: 28,
    deadZone: 0.08,
  },
};
