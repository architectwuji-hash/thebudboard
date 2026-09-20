import { CONFIG } from './config.js';
import { computeShopButtonRect } from './hudLayout.js';

/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */

const POWER_IDS = [
  'rapidFire',
  'heavyRounds',
  'targeting',
  'magnet',
  'baseHealth',
  'playerHealth',
  'playerDamage',
  'recruitSoldier',
  'soldierHealth',
  'soldierDamage',
  'unlockTower',
  'towerDamage',
];

const RECRUIT_POWER_ID = 'recruitSoldier';
const UNLOCK_TOWER_POWER_ID = 'unlockTower';

export function createInitialUpgrades() {
  return {
    rapidFire: 0,
    heavyRounds: 0,
    targeting: 0,
    magnet: 0,
    baseHealth: 0,
    playerHealth: 0,
    playerDamage: 0,
    soldierHealth: 0,
    soldierDamage: 0,
    unlockedTowerCount: 0,
    towerDamage: 0,
  };
}

export function getUnlockedTowerCount(state) {
  const count = state.upgrades.unlockedTowerCount ?? 0;
  return Math.min(Math.max(0, count), CONFIG.TOWER.count);
}

export function getEffectiveTowerDamage(state) {
  const base = CONFIG.TOWER.damage;
  const level = state.upgrades.towerDamage ?? 0;
  if (level <= 0) return base;
  const { damagePerLevel } = CONFIG.SHOP.powers.towerDamage;
  return base + level * damagePerLevel;
}

/** Recruits always cost the flat baseCost (not level-scaled). */
export function getRecruitSoldierCost() {
  return CONFIG.SHOP.powers.recruitSoldier.baseCost;
}

export function getEffectiveSoldierMaxHp(state) {
  const base = CONFIG.SOLDIER.baseMaxHp;
  const level = state.upgrades.soldierHealth ?? 0;
  if (level <= 0) return base;
  const { hpPerLevel } = CONFIG.SHOP.powers.soldierHealth;
  return base + level * hpPerLevel;
}

export function getEffectiveSoldierDamage(state) {
  const base = CONFIG.SOLDIER.baseDamage;
  const level = state.upgrades.soldierDamage ?? 0;
  if (level <= 0) return base;
  const { damagePerLevel } = CONFIG.SHOP.powers.soldierDamage;
  return base + level * damagePerLevel;
}

export function getPowerDefinition(powerId) {
  return CONFIG.SHOP.powers[powerId];
}

export function listShopPowerIds() {
  return POWER_IDS;
}

export function getUpgradeCost(powerId, currentLevel) {
  if (powerId === RECRUIT_POWER_ID) {
    return getRecruitSoldierCost();
  }
  if (powerId === UNLOCK_TOWER_POWER_ID) {
    if (currentLevel >= CONFIG.TOWER.count) return null;
    const power = getPowerDefinition(powerId);
    return Math.round(power.baseCost * CONFIG.SHOP.costScale ** currentLevel);
  }
  const power = getPowerDefinition(powerId);
  if (currentLevel >= CONFIG.SHOP.maxLevel) return null;
  return Math.round(power.baseCost * CONFIG.SHOP.costScale ** currentLevel);
}

export function getNextLevelDescription(powerId, currentLevel, state = null) {
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
  if (powerId === 'targeting') {
    const range = CONFIG.PLAYER.autoAimRange + next * power.rangeBonusPerLevel;
    return `Lv${next}: ${Math.round(range)}px auto-aim range`;
  }
  if (powerId === 'magnet') {
    const radius = power.baseRadius + next * power.radiusPerLevel;
    return `Lv${next}: ${Math.round(radius)}px orb pull radius`;
  }
  if (powerId === 'baseHealth') {
    return `Lv${next}: +${power.hpPerLevel} base max HP (heals)`;
  }
  if (powerId === 'playerHealth') {
    return `Lv${next}: +${power.hpPerLevel} player max HP (heals)`;
  }
  if (powerId === 'playerDamage') {
    return `Lv${next}: +${power.damagePerLevel} bullet damage per shot`;
  }
  if (powerId === 'recruitSoldier') {
    const hp = state ? getEffectiveSoldierMaxHp(state) : CONFIG.SOLDIER.baseMaxHp;
    const dmg = state ? getEffectiveSoldierDamage(state) : CONFIG.SOLDIER.baseDamage;
    return `Spawn ally · ${hp} HP · ${dmg} dmg/shot`;
  }
  if (powerId === 'soldierHealth') {
    const maxHp = getEffectiveSoldierMaxHpFromLevel(next);
    return `Lv${next}: new recruits ${maxHp} max HP (existing unchanged)`;
  }
  if (powerId === 'soldierDamage') {
    const dmg = getEffectiveSoldierDamageFromLevel(next);
    return `Lv${next}: new recruits ${dmg} damage (existing unchanged)`;
  }
  if (powerId === 'unlockTower') {
    const slot = next;
    return `Slot ${slot}/${CONFIG.TOWER.count} · auto-turret around base`;
  }
  if (powerId === 'towerDamage') {
    const dmg =
      CONFIG.TOWER.damage + next * CONFIG.SHOP.powers.towerDamage.damagePerLevel;
    return `Lv${next}: ${dmg} damage per tower shot`;
  }
  return '';
}

function getEffectiveSoldierMaxHpFromLevel(soldierHealthLevel) {
  const base = CONFIG.SOLDIER.baseMaxHp;
  if (soldierHealthLevel <= 0) return base;
  const { hpPerLevel } = CONFIG.SHOP.powers.soldierHealth;
  return base + soldierHealthLevel * hpPerLevel;
}

function getEffectiveSoldierDamageFromLevel(soldierDamageLevel) {
  const base = CONFIG.SOLDIER.baseDamage;
  if (soldierDamageLevel <= 0) return base;
  const { damagePerLevel } = CONFIG.SHOP.powers.soldierDamage;
  return base + soldierDamageLevel * damagePerLevel;
}

function applyUpgradeEffects(state, powerId) {
  const power = getPowerDefinition(powerId);

  if (powerId === 'baseHealth') {
    state.base.maxHp += power.hpPerLevel;
    state.base.hp += power.hpPerLevel;
    return;
  }

  if (powerId === 'playerHealth') {
    state.player.maxHp += power.hpPerLevel;
    state.player.hp += power.hpPerLevel;
  }
}

/** Set by logic.js to spawn recruits without a circular import. */
let recruitSoldierHandler = null;

export function setRecruitSoldierHandler(handler) {
  recruitSoldierHandler = handler;
}

export function tryPurchaseUpgrade(state, powerId) {
  if (powerId === RECRUIT_POWER_ID) {
    const cost = getRecruitSoldierCost();
    if (state.score < cost || !recruitSoldierHandler) return false;
    state.score -= cost;
    recruitSoldierHandler(state);
    return true;
  }

  if (powerId === UNLOCK_TOWER_POWER_ID) {
    const unlocked = getUnlockedTowerCount(state);
    if (unlocked >= CONFIG.TOWER.count) return false;
    const cost = getUpgradeCost(powerId, unlocked);
    if (cost === null || state.score < cost) return false;
    state.score -= cost;
    state.upgrades.unlockedTowerCount = unlocked + 1;
    return true;
  }

  const level = state.upgrades[powerId] ?? 0;
  if (level >= CONFIG.SHOP.maxLevel) return false;

  const cost = getUpgradeCost(powerId, level);
  if (cost === null || state.score < cost) return false;

  state.score -= cost;
  state.upgrades[powerId] = level + 1;
  applyUpgradeEffects(state, powerId);
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

export function getEffectiveAutoAimRange(state) {
  const base = CONFIG.PLAYER.autoAimRange;
  const level = state.upgrades.targeting ?? 0;
  if (level <= 0) return base;

  const { rangeBonusPerLevel } = CONFIG.SHOP.powers.targeting;
  return base + level * rangeBonusPerLevel;
}

export function getEffectiveBulletDamage(state) {
  const base = CONFIG.BULLET.damage;
  const heavyLevel = state.upgrades.heavyRounds ?? 0;
  const damageLevel = state.upgrades.playerDamage ?? 0;

  let damage = base;
  if (heavyLevel > 0) {
    const { damageBonusPerLevel } = CONFIG.SHOP.powers.heavyRounds;
    damage *= 1 + heavyLevel * damageBonusPerLevel;
  }
  if (damageLevel > 0) {
    damage += damageLevel * CONFIG.SHOP.powers.playerDamage.damagePerLevel;
  }
  return damage;
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
export function getShopLayout(viewportWidth, viewportHeight, ctx, gameState) {
  const { overlay } = CONFIG.SHOP;
  const shopButton =
    ctx && gameState
      ? computeShopButtonRect(
          ctx,
          viewportWidth,
          gameState.base,
          gameState.player,
          gameState.wave,
          gameState.score,
        )
      : {
          x: viewportWidth - CONFIG.SHOP.button.margin - CONFIG.SHOP.button.width,
          y: CONFIG.SHOP.button.margin,
          width: CONFIG.SHOP.button.width,
          height: CONFIG.SHOP.button.height,
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
export function handleShopPointer(
  state,
  clientX,
  clientY,
  viewportWidth,
  viewportHeight,
  ctx,
) {
  const layout = getShopLayout(viewportWidth, viewportHeight, ctx, state);

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
