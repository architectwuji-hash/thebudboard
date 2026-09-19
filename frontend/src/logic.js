import { CONFIG } from './config.js';

/**
 * Pure game logic — updates state only; never touches the canvas.
 */

let nextEnemyId = 1;

export function createGameState(width, height) {
  const base = {
    x: width / 2,
    y: height / 2,
    hp: CONFIG.BASE.maxHp,
    maxHp: CONFIG.BASE.maxHp,
  };

  const player = {
    x: base.x + CONFIG.PLAYER.startOffsetX,
    y: base.y + CONFIG.PLAYER.startOffsetY,
    hp: CONFIG.PLAYER.maxHp,
    maxHp: CONFIG.PLAYER.maxHp,
    fireCooldownRemaining: 0,
  };

  return {
    base,
    player,
    bullets: [],
    enemies: [],
    spawnTimerRemaining: CONFIG.ENEMY.spawnIntervalSeconds,
    worldWidth: width,
    worldHeight: height,
  };
}

/** Re-center base on resize; keep player offset then clamp to bounds. */
export function resizeGameState(state, width, height) {
  const dx = width / 2 - state.base.x;
  const dy = height / 2 - state.base.y;

  state.base.x = width / 2;
  state.base.y = height / 2;
  state.player.x += dx;
  state.player.y += dy;
  state.worldWidth = width;
  state.worldHeight = height;

  clampPlayerToWorld(state);
}

/**
 * @param {{ axisX: number, axisY: number }} movement — normalized movement, -1..1
 */
export function updateGameState(state, deltaSeconds, movement) {
  updateSpawns(state, deltaSeconds);

  const { speed } = CONFIG.PLAYER;
  state.player.x += movement.axisX * speed * deltaSeconds;
  state.player.y += movement.axisY * speed * deltaSeconds;
  clampPlayerToWorld(state);

  updateEnemies(state, deltaSeconds);
  resolveEnemyContactDamage(state, deltaSeconds);
  updateAutoCombat(state, deltaSeconds);
  updateBullets(state, deltaSeconds);
}

function updateSpawns(state, deltaSeconds) {
  state.spawnTimerRemaining -= deltaSeconds;
  while (state.spawnTimerRemaining <= 0) {
    state.enemies.push(createEnemyAtEdge(state));
    state.spawnTimerRemaining += CONFIG.ENEMY.spawnIntervalSeconds;
  }
}

function createEnemyAtEdge(state) {
  const { spawnEdgePadding } = CONFIG.ENEMY;
  const w = state.worldWidth;
  const h = state.worldHeight;
  const edge = Math.floor(Math.random() * 4);
  let x;
  let y;

  switch (edge) {
    case 0:
      x = Math.random() * w;
      y = spawnEdgePadding;
      break;
    case 1:
      x = w - spawnEdgePadding;
      y = Math.random() * h;
      break;
    case 2:
      x = Math.random() * w;
      y = h - spawnEdgePadding;
      break;
    default:
      x = spawnEdgePadding;
      y = Math.random() * h;
      break;
  }

  return {
    id: nextEnemyId++,
    x,
    y,
    hp: CONFIG.ENEMY.maxHp,
    maxHp: CONFIG.ENEMY.maxHp,
    baseContactCooldown: 0,
    playerContactCooldown: 0,
  };
}

function updateEnemies(state, deltaSeconds) {
  const { speed } = CONFIG.ENEMY;

  for (const enemy of state.enemies) {
    const target = pickEnemyTarget(state, enemy);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) continue;

    const step = speed * deltaSeconds;
    const move = Math.min(step, dist);
    enemy.x += (dx / dist) * move;
    enemy.y += (dy / dist) * move;
  }
}

/** Move toward whichever of base or player is closer. */
function pickEnemyTarget(state, enemy) {
  const toBase = Math.hypot(state.base.x - enemy.x, state.base.y - enemy.y);
  const toPlayer = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
  return toPlayer < toBase ? state.player : state.base;
}

function resolveEnemyContactDamage(state, deltaSeconds) {
  const { radius: enemyRadius, contactDamage, contactCooldownSeconds } =
    CONFIG.ENEMY;
  const baseRadius = CONFIG.BASE.radius;
  const playerRadius = CONFIG.PLAYER.radius;

  for (const enemy of state.enemies) {
    enemy.baseContactCooldown = Math.max(
      0,
      enemy.baseContactCooldown - deltaSeconds,
    );
    enemy.playerContactCooldown = Math.max(
      0,
      enemy.playerContactCooldown - deltaSeconds,
    );

    if (
      circlesOverlap(
        enemy.x,
        enemy.y,
        enemyRadius,
        state.base.x,
        state.base.y,
        baseRadius,
      ) &&
      enemy.baseContactCooldown <= 0
    ) {
      state.base.hp = Math.max(0, state.base.hp - contactDamage);
      enemy.baseContactCooldown = contactCooldownSeconds;
    }

    if (
      circlesOverlap(
        enemy.x,
        enemy.y,
        enemyRadius,
        state.player.x,
        state.player.y,
        playerRadius,
      ) &&
      enemy.playerContactCooldown <= 0
    ) {
      state.player.hp = Math.max(0, state.player.hp - contactDamage);
      enemy.playerContactCooldown = contactCooldownSeconds;
    }
  }
}

function updateAutoCombat(state, deltaSeconds) {
  state.player.fireCooldownRemaining = Math.max(
    0,
    state.player.fireCooldownRemaining - deltaSeconds,
  );

  const aim = findAutoAimTarget(state);
  if (!aim || state.player.fireCooldownRemaining > 0) return;

  spawnBullet(state, aim.aimX, aim.aimY);
  state.player.fireCooldownRemaining = CONFIG.PLAYER.fireCooldownSeconds;
}

function findAutoAimTarget(state) {
  const { autoAimRange } = CONFIG.PLAYER;
  let bestDist = autoAimRange;
  let bestEnemy = null;

  for (const enemy of state.enemies) {
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestEnemy = enemy;
    }
  }

  if (!bestEnemy) return null;

  const dx = bestEnemy.x - state.player.x;
  const dy = bestEnemy.y - state.player.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return null;

  return { aimX: dx / len, aimY: dy / len };
}

function spawnBullet(state, aimX, aimY) {
  const { radius } = CONFIG.PLAYER;
  const { radius: bulletRadius } = CONFIG.BULLET;
  const spawnOffset = radius + bulletRadius + 2;

  state.bullets.push({
    x: state.player.x + aimX * spawnOffset,
    y: state.player.y + aimY * spawnOffset,
    vx: aimX,
    vy: aimY,
  });
}

function updateBullets(state, deltaSeconds) {
  const { speed, cullMargin, damage, radius: bulletRadius } = CONFIG.BULLET;
  const maxX = state.worldWidth + cullMargin;
  const maxY = state.worldHeight + cullMargin;
  const min = -cullMargin;
  const enemyRadius = CONFIG.ENEMY.radius;

  const remainingBullets = [];

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * speed * deltaSeconds;
    bullet.y += bullet.vy * speed * deltaSeconds;

    if (bullet.x < min || bullet.x > maxX || bullet.y < min || bullet.y > maxY) {
      continue;
    }

    let consumed = false;
    for (const enemy of state.enemies) {
      if (
        circlesOverlap(
          bullet.x,
          bullet.y,
          bulletRadius,
          enemy.x,
          enemy.y,
          enemyRadius,
        )
      ) {
        enemy.hp -= damage;
        consumed = true;
        break;
      }
    }

    if (!consumed) remainingBullets.push(bullet);
  }

  state.bullets = remainingBullets;
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const sum = r1 + r2;
  return dx * dx + dy * dy <= sum * sum;
}

function clampPlayerToWorld(state) {
  const r = CONFIG.PLAYER.radius;
  const maxX = state.worldWidth - r;
  const maxY = state.worldHeight - r;

  state.player.x = Math.min(maxX, Math.max(r, state.player.x));
  state.player.y = Math.min(maxY, Math.max(r, state.player.y));
}
