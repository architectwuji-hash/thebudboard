/**
 * All gameplay and presentation constants live here.
 * Logic and render modules read from CONFIG — no magic numbers elsewhere.
 */
export const CONFIG = {
  BASE: {
    maxHp: 100,
    radius: 45,
    fill: '#eab308',
    stroke: '#a16207',
    strokeWidth: 3,
    hpFont: 'bold 18px system-ui, sans-serif',
    hpColor: '#1c1917',
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
    yScreenRatio: 0.8,
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
    autoAimRange: 260,
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

  PICKUP: {
    radius: 8,
    fill: '#facc15',
    stroke: '#ca8a04',
    strokeWidth: 1,
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
    scoreLabel: 'Score',
    font: '600 18px system-ui, sans-serif',
    color: '#e2e8f0',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    paddingX: 16,
    paddingY: 16,
    lineHeight: 24,
    /** Min gap between left HP block and wave/score badges. */
    hudElementGap: 12,
    /** Extra space below HP lines when badges move to a second row. */
    hudBadgeRowGap: 8,
    waveBadgeFont: '700 16px system-ui, sans-serif',
    waveBadgeFill: 'rgba(15, 23, 42, 0.85)',
    waveBadgeStroke: 'rgba(148, 163, 184, 0.45)',
    waveBadgeText: '#f8fafc',
    waveBadgePaddingX: 18,
    waveBadgePaddingY: 8,
    waveBadgeRadius: 10,
  },

  SHOP: {
    maxLevel: 5,
    costScale: 1.6,
    rapidFireMaxReduction: 0.6,
    powers: {
      rapidFire: {
        name: 'Rapid Fire',
        shortLabel: 'RF',
        baseCost: 8,
        cooldownReductionPerLevel: 0.15,
        accent: '#38bdf8',
      },
      heavyRounds: {
        name: 'Heavy Rounds',
        shortLabel: 'HR',
        baseCost: 10,
        damageBonusPerLevel: 0.1,
        accent: '#f97316',
      },
      targeting: {
        name: 'Targeting',
        shortLabel: 'TG',
        baseCost: 7,
        rangeBonusPerLevel: 70,
        accent: '#2dd4bf',
      },
      magnet: {
        name: 'Magnet',
        shortLabel: 'MG',
        baseCost: 6,
        /** Orb pull radius at level 1; each level adds radiusPerLevel. */
        baseRadius: 12,
        radiusPerLevel: 28,
        pullSpeed: 260,
        pullSpeedPerLevel: 35,
        accent: '#a78bfa',
      },
    },
    button: {
      label: 'Shop',
      width: 72,
      height: 36,
      margin: 16,
      /** Space below wave/score badges before the shop button. */
      gapBelowPoints: 8,
      font: '700 14px system-ui, sans-serif',
      fill: 'rgba(15, 23, 42, 0.9)',
      stroke: 'rgba(148, 163, 184, 0.55)',
      text: '#f8fafc',
      radius: 8,
    },
    overlay: {
      margin: 16,
      panelMaxWidth: 360,
      panelHeight: 400,
      panelPaddingX: 16,
      headerHeight: 56,
      footerHeight: 56,
      rowHeight: 52,
      rowGap: 10,
      resumeHeight: 40,
      dim: 'rgba(0, 0, 0, 0.58)',
      panelFill: 'rgba(15, 23, 42, 0.96)',
      panelStroke: 'rgba(148, 163, 184, 0.45)',
      panelRadius: 12,
      titleFont: '700 20px system-ui, sans-serif',
      rowFont: '600 15px system-ui, sans-serif',
      detailFont: '500 12px system-ui, sans-serif',
      titleColor: '#f8fafc',
      rowColor: '#e2e8f0',
      detailColor: '#94a3b8',
      rowFill: 'rgba(30, 41, 59, 0.85)',
      rowStroke: 'rgba(148, 163, 184, 0.35)',
      rowRadius: 8,
      resumeLabel: 'Resume',
      resumeFill: '#22c55e',
      resumeText: '#052e16',
    },
    buffIconSize: 10,
    buffIconGap: 6,
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
