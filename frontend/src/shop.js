import { CONFIG } from './config.js';

/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */

const POWER_IDS = ['rapidFire', 'heavyRounds', 'magnet'];

export function createInitialUpgrades() {
  return {
    rapidFire: 0,
    heavyRounds: 0,
    magnet: 0,
  };
}

export function getPowerDefinition(powerId) {
  return CONFIG.SHOP.powers[powerId];
}

export function listShopPowerIds() {
  return POWER_IDS;
}

export function getUpgradeCost(powerId, currentLevel) {
  const power = getPowerDefinition(powerId);
  if (currentLevel >= CONFIG.SHOP.maxLevel) return null;
  return Math.round(power.baseCost * CONFIG.SHOP.costScale ** currentLevel);
}

export function getNextLevelDescription(powerId, currentLevel) {
  const power = getPowerDefinition(powerId);
  const next = currentLevel + 1;
  if (next > CONFIG.SHOP.maxLevel) return 'MAX';

  if (powerId === 'rapidFire') {
    const reduction = Math.min(
      next * power.cooldownReductionPerLevel,
      CONFIG.SHOP.rapidFireMaxReduction,
    );
    return `Lv${next}: −${Math.round(reduction * 100)}% fire cooldown`;
  }
  if (powerId === 'heavyRounds') {
    return `Lv${next}: +${Math.round(next * power.damageBonusPerLevel * 100)}% bullet damage`;
  }
  if (powerId === 'magnet') {
    const radius = power.baseRadius + next * power.radiusPerLevel;
    return `Lv${next}: ${Math.round(radius)}px orb pull radius`;
  }
  return '';
}

export function tryPurchaseUpgrade(state, powerId) {
  const level = state.upgrades[powerId] ?? 0;
  if (level >= CONFIG.SHOP.maxLevel) return false;

  const cost = getUpgradeCost(powerId, level);
  if (cost === null || state.score < cost) return false;

  state.score -= cost;
  state.upgrades[powerId] = level + 1;
  return true;
}

export function toggleShopOpen(state) {
  state.shopOpen = !state.shopOpen;
}

export function getEffectiveFireCooldownSeconds(state) {
  const base = CONFIG.PLAYER.fireCooldownSeconds;
  const level = state.upgrades.rapidFire ?? 0;
  if (level <= 0) return base;

  const { cooldownReductionPerLevel } = CONFIG.SHOP.powers.rapidFire;
  const reduction = Math.min(
    level * cooldownReductionPerLevel,
    CONFIG.SHOP.rapidFireMaxReduction,
  );
  return base * (1 - reduction);
}

export function getEffectiveBulletDamage(state) {
  const base = CONFIG.BULLET.damage;
  const level = state.upgrades.heavyRounds ?? 0;
  if (level <= 0) return base;

  const { damageBonusPerLevel } = CONFIG.SHOP.powers.heavyRounds;
  return base * (1 + level * damageBonusPerLevel);
}

export function getMagnetPullStats(state) {
  const level = state.upgrades.magnet ?? 0;
  if (level <= 0) return null;

  const power = CONFIG.SHOP.powers.magnet;
  return {
    radius: power.baseRadius + level * power.radiusPerLevel,
    speed: power.pullSpeed + level * power.pullSpeedPerLevel,
  };
}

export function updateMagnetPickups(state, deltaSeconds) {
  const magnet = getMagnetPullStats(state);
  if (!magnet) return;

  const { x: px, y: py } = state.player;

  for (const pickup of state.pickups) {
    const dx = px - pickup.x;
    const dy = py - pickup.y;
    const dist = Math.hypot(dx, dy);
    if (dist > magnet.radius || dist < 0.001) continue;

    const step = magnet.speed * deltaSeconds;
    const move = Math.min(step, dist);
    pickup.x += (dx / dist) * move;
    pickup.y += (dy / dist) * move;
  }
}

/**
 * Layout for shop button and overlay controls (screen space).
 * @returns {{ shopButton: Rect, panel: Rect, rows: Rect[], resumeButton: Rect }}
 */
export function getShopLayout(viewportWidth, viewportHeight) {
  const { button, overlay } = CONFIG.SHOP;
  const shopButton = {
    x: viewportWidth - button.margin - button.width,
    y: button.margin,
    width: button.width,
    height: button.height,
  };

  const panelWidth = Math.min(overlay.panelMaxWidth, viewportWidth - overlay.margin * 2);
  const rowHeight = overlay.rowHeight;
  const rowGap = overlay.rowGap;
  const rows = POWER_IDS.map((_, index) => ({
    x: (viewportWidth - panelWidth) / 2 + overlay.panelPaddingX,
    y:
      (viewportHeight - overlay.panelHeight) / 2 +
      overlay.headerHeight +
      index * (rowHeight + rowGap),
    width: panelWidth - overlay.panelPaddingX * 2,
    height: rowHeight,
  }));

  const panel = {
    x: (viewportWidth - panelWidth) / 2,
    y: (viewportHeight - overlay.panelHeight) / 2,
    width: panelWidth,
    height: overlay.panelHeight,
  };

  const resumeButton = {
    x: panel.x + overlay.panelPaddingX,
    y: panel.y + panel.height - overlay.footerHeight,
    width: panelWidth - overlay.panelPaddingX * 2,
    height: overlay.resumeHeight,
  };

  return { shopButton, panel, rows, resumeButton };
}

function pointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Handle a screen-space pointer tap (shop toggle, purchases, resume).
 * @returns {boolean} true if the event was consumed by shop UI
 */
export function handleShopPointer(state, clientX, clientY, viewportWidth, viewportHeight) {
  const layout = getShopLayout(viewportWidth, viewportHeight);

  if (state.shopOpen) {
    if (pointInRect(clientX, clientY, layout.resumeButton)) {
      state.shopOpen = false;
      return true;
    }

    for (let i = 0; i < POWER_IDS.length; i++) {
      if (pointInRect(clientX, clientY, layout.rows[i])) {
        tryPurchaseUpgrade(state, POWER_IDS[i]);
        return true;
      }
    }

    if (!pointInRect(clientX, clientY, layout.panel)) {
      state.shopOpen = false;
      return true;
    }
    return true;
  }

  if (pointInRect(clientX, clientY, layout.shopButton)) {
    state.shopOpen = true;
    return true;
  }

  return false;
}
