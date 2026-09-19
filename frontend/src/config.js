/**
 * All gameplay and presentation constants live here.
 * Logic and render modules read from CONFIG — no magic numbers elsewhere.
 */
export const CONFIG = {
  BASE: {
    maxHp: 100,
    radius: 56,
    /** Distance from the bottom edge of the playfield to the base center. */
    bottomPadding: 20,
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
    maxHp: 100,
    /** World-units per second. */
    speed: 240,
    /** Horizontal gap between base and player at spawn (world units). */
    startGapFromBase: 5,
    /** Minimum seconds between auto-shots. */
    fireCooldownSeconds: 0.22,
    /** Max distance to acquire a target for auto-aim (world units). */
    autoAimRange: 9999,
  },

  BULLET: {
    radius: 5,
    fill: '#fbbf24',
    stroke: '#fef3c7',
    strokeWidth: 1,
    /** World-units per second. */
    speed: 520,
    damage: 34,
    /** Extra margin beyond world bounds before removing a bullet. */
    cullMargin: 24,
  },

  ENEMY: {
    radius: 18,
    fill: '#ef4444',
    stroke: '#fecaca',
    strokeWidth: 2,
    maxHp: 68,
    /** World-units per second toward base or player (whichever is closer). */
    speed: 95,
    /** Damage applied on touch (per cooldown window). */
    contactDamage: 12,
    /** Seconds before the same enemy can damage the same target again. */
    contactCooldownSeconds: 0.85,
    spawnIntervalSeconds: 2.4,
    hpFont: 'bold 14px system-ui, sans-serif',
    hpColor: '#ffffff',
  },

  /** Playfield is larger than the viewport so enemies travel longer before reaching the base. */
  WORLD: {
    /** World size = viewport size × this factor (uniform). */
    viewportScale: 1.45,
  },

  CANVAS: {
    background: '#0f172a',
  },

  HUD: {
    baseLabel: 'Base HP',
    playerLabel: 'Player HP',
    font: '600 18px system-ui, sans-serif',
    color: '#e2e8f0',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    paddingX: 16,
    paddingY: 16,
    lineHeight: 24,
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
