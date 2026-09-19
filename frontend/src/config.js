/**
 * All gameplay and presentation constants live here.
 * Logic and render modules read from CONFIG — no magic numbers elsewhere.
 */
export const CONFIG = {
  BASE: {
    maxHp: 100,
    /** Legacy layout reference; wall TD uses WALL for defense line. */
    radius: 45,
  },

  /** Horizontal corridor for gameplay entities (fractions of viewport width). */
  PLAY_AREA: {
    leftRatio: 0.12,
    rightRatio: 0.88,
    gutterFill: '#0a0e14',
    edgeLineColor: 'rgba(148, 163, 184, 0.35)',
    edgeLineWidth: 1,
  },

  WALL: {
    /** Wall center Y as a fraction of viewport height (canvas height). */
    yScreenRatio: 0.62,
    /** Half-height of the stone bar (total height = halfHeight * 2). */
    halfHeight: 8,
    fill: '#7a7a8a',
    borderColor: '#4a4a58',
    borderWidth: 2,
    /** Decorative gate arch width at wall center. */
    gateWidth: 72,
    gateHeight: 14,
    gateFill: '#5c5c6a',
  },

  PLAYER: {
    radius: 14,
    fill: '#22c55e',
    stroke: '#bbf7d0',
    strokeWidth: 2,
    maxHp: 100,
    /** World-units per second. */
    speed: 240,
    /** Standoff above the wall center line. */
    standoffAboveWall: 4,
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
    radius: 12,
    fill: '#ef4444',
    stroke: '#fecaca',
    strokeWidth: 2,
    maxHp: 68,
    /** World-units per second toward wall or player (whichever is closer). */
    speed: 95,
    /** Damage applied when breaching the wall or touching the player. */
    contactDamage: 12,
    /** Seconds before the same enemy can damage the player again. */
    contactCooldownSeconds: 0.85,
    spawnIntervalSeconds: 2.4,
    hpFont: 'bold 11px system-ui, sans-serif',
    hpColor: '#ffffff',
  },

  /** World matches viewport so layout bands align with the screen. */
  WORLD: {
    viewportScale: 1,
  },

  CANVAS: {
    background: '#0f172a',
    protectedZone: '#0d1117',
  },

  HUD: {
    baseLabel: 'Base HP',
    playerLabel: 'Player HP',
    waveLabel: 'Wave',
    font: '600 18px system-ui, sans-serif',
    color: '#e2e8f0',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    paddingX: 16,
    paddingY: 16,
    lineHeight: 24,
    waveBadgeFont: '700 16px system-ui, sans-serif',
    waveBadgeFill: 'rgba(15, 23, 42, 0.85)',
    waveBadgeStroke: 'rgba(148, 163, 184, 0.45)',
    waveBadgeText: '#f8fafc',
    waveBadgePaddingX: 18,
    waveBadgePaddingY: 8,
    waveBadgeRadius: 10,
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
