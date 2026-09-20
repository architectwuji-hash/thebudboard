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

  /** Five static turrets orbiting the base (logic positions, render meshes). */
  TOWER: {
    count: 5,
    orbitRadius: 78,
    /** Arc above the base (radians; −π/2 points toward top of screen). */
    arcStartRad: -2.75,
    arcEndRad: -0.39,
    radius: 11,
    range: 340,
    fireCooldownSeconds: 0.5,
    damage: 24,
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
    /** Delay between spawning each enemy within the same wave. */
    spawnIntervalSeconds: 0.85,
    /** Pause after clearing a wave before the next wave begins. */
    interWaveDelaySeconds: 2,
    hpFont: 'bold 11px system-ui, sans-serif',
    hpColor: '#ffffff',
  },

  /** One boss per wave when wave number is a multiple of everyNWaves. */
  BOSS: {
    everyNWaves: 10,
    maxHp: 420,
    /** Added for each boss tier (wave 20, 30, …). */
    maxHpPerTier: 160,
    radius: 22,
    speed: 78,
    contactDamage: 26,
    contactCooldownSeconds: 0.85,
  },

  /** World matches viewport so layout bands align with the screen. */
  WORLD: {
    viewportScale: 1,
    /** Pixels → Three.js units for the WebGL layer. */
    scale3d: 0.055,
    fogColor: 0xc5d4e8,
    /** Near-zero = clear view; slight tint only at far edges. */
    fogDensity: 0.003,
  },

  /** Three.js renderer, materials, and camera (render.js only). */
  RENDER3D: {
    clearColor: 0xc5d4e8,
    toneMappingExposure: 2.35,
    enableShadows: false,
    cameraFov: 52,
    cameraTiltDeg: 66,
    cameraDistanceScale: 0.92,
    baseColor: 0x92400e,
    baseEmissive: 0x78350f,
    baseEmissiveIntensity: 0.35,
    /** Dark silhouettes on a light field — low emissive so they read clearly. */
    playerColor: 0x14532d,
    playerEmissive: 0x052e16,
    playerEmissiveIntensity: 0.12,
    enemyColor: 0x7f1d1d,
    enemyEmissive: 0x450a0a,
    enemyEmissiveIntensity: 0.15,
    bossColor: 0x4c1d95,
    bossEmissive: 0x2e1065,
    bossEmissiveIntensity: 0.35,
    bossScaleMultiplier: 1.55,
    bulletColor: 0x422006,
    bulletEmissive: 0xca8a04,
    bulletEmissiveIntensity: 1.1,
    pickupColor: 0x713f12,
    pickupEmissive: 0xb45309,
    pickupEmissiveIntensity: 0.85,
    wallColor: 0xc4cad4,
    wallRoughness: 0.55,
    wallMetalness: 0.12,
    floorColor: 0xb8c8de,
    floorEmissive: 0x94a3b8,
    floorEmissiveIntensity: 0.22,
    gutterColor: 0x94a3b8,
    protectedColor: 0xa8b8cf,
    roughnessDefault: 0.48,
    metalnessDefault: 0.08,
    capsuleEnemyRadius: 0.42,
    capsuleEnemyLength: 1.05,
    capsuleBulletRadius: 0.32,
    capsuleBulletLength: 0.85,
    pulseLightColor: 0xfde047,
    pulseLightMin: 2.5,
    pulseLightMax: 5.5,
    pulseSpeed: 2.4,
    keyLightColor: 0xffb060,
    keyLightIntensity: 5.5,
    rimLightColor: 0xe0f2fe,
    rimLightIntensity: 2.2,
    fillLightColor: 0xfff4e6,
    fillLightIntensity: 2.8,
    ambientColor: 0xdbeafe,
    ambientIntensity: 1.65,
    hemisphereSkyColor: 0xf0f9ff,
    hemisphereGroundColor: 0x64748b,
    hemisphereIntensity: 1.35,
    enemyInstancedThreshold: 10,
    towerColor: 0x374151,
    towerEmissive: 0x1f2937,
    towerEmissiveIntensity: 0.2,
  },

  CANVAS: {
    background: '#0f172a',
    protectedZone: '#0d1117',
  },

  GAME_OVER: {
    title: 'Game Over',
    message: 'Your base was destroyed.',
    restartHint: 'Tap anywhere or press Enter to play again',
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
      baseHealth: {
        name: 'Base Health',
        shortLabel: 'BH',
        baseCost: 12,
        hpPerLevel: 25,
        accent: '#eab308',
      },
      playerHealth: {
        name: 'Player Health',
        shortLabel: 'PH',
        baseCost: 10,
        hpPerLevel: 20,
        accent: '#22c55e',
      },
      playerDamage: {
        name: 'Player Damage',
        shortLabel: 'PD',
        baseCost: 11,
        damagePerLevel: 10,
        accent: '#dc2626',
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
      panelHeight: 548,
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
