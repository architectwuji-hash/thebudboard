import { CONFIG } from './config.js';

/**
 * Pure game logic — updates state only; never touches the canvas.
 */

let nextEnemyId = 1;

function worldDimensionsFromViewport(viewportWidth, viewportHeight) {
  const scale = CONFIG.WORLD.viewportScale;
  return {
    worldWidth: viewportWidth * scale,
    worldHeight: viewportHeight * scale,
  };
}

function basePosition(worldWidth, worldHeight) {
  const { radius, bottomPadding } = CONFIG.BASE;
  return {
    x: worldWidth / 2,
    y: worldHeight - radius - bottomPadding,
  };
}

function playerStartPosition(base) {
  const { radius: baseRadius } = CONFIG.BASE;
  const { radius: playerRadius, startGapFromBase } = CONFIG.PLAYER;
  return {
    x: base.x + baseRadius + playerRadius + startGapFromBase,
    y: base.y,
  };
}

/** Camera top-left in world space; keeps the player near the center of the view. */
export function getCamera(state, viewportWidth, viewportHeight) {
  const maxX = Math.max(0, state.worldWidth - viewportWidth);
  const maxY = Math.max(0, state.worldHeight - viewportHeight);

  return {
    x: Math.min(maxX, Math.max(0, state.player.x - viewportWidth / 2)),
    y: Math.min(maxY, Math.max(0, state.player.y - viewportHeight / 2)),
  };
}

export function createGameState(viewportWidth, viewportHeight) {
  const { worldWidth, worldHeight } = worldDimensionsFromViewport(
    viewportWidth,
    viewportHeight,
  );

  const base = {
    ...basePosition(worldWidth, worldHeight),
    hp: CONFIG.BASE.maxHp,
    maxHp: CONFIG.BASE.maxHp,
  };

  const player = {
    ...playerStartPosition(base),
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
    viewportWidth,
    viewportHeight,
    worldWidth,
    worldHeight,
  };
}

/** Re-anchor base to bottom-center on resize; preserve offsets for entities. */
export function resizeGameState(state, viewportWidth, viewportHeight) {
  const { worldWidth, worldHeight } = worldDimensionsFromViewport(
    viewportWidth,
    viewportHeight,
  );

  const anchoredBase = basePosition(worldWidth, worldHeight);
  const dx = anchoredBase.x - state.base.x;
  const dy = anchoredBase.y - state.base.y;

  state.base.x = anchoredBase.x;
  state.base.y = anchoredBase.y;
  state.player.x += dx;
  state.player.y += dy;

  for (const enemy of state.enemies) {
    enemy.x += dx;
    enemy.y += dy;
  }
  for (const bullet of state.bullets) {
    bullet.x += dx;
    bullet.y += dy;
  }

  state.viewportWidth = viewportWidth;
  state.viewportHeight = viewportHeight;
  state.worldWidth = worldWidth;
  state.worldHeight = worldHeight;

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
    state.enemies.push(createEnemyAtTopEdge(state));
    state.spawnTimerRemaining += CONFIG.ENEMY.spawnIntervalSeconds;
  }
}

function createEnemyAtTopEdge(state) {
  const { radius } = CONFIG.ENEMY;

  return {
    id: nextEnemyId++,
    x: Math.random() * state.worldWidth,
    y: -radius,
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
