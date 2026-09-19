import { CONFIG } from './config.js';

/**
 * Pure game logic — updates state only; never touches the canvas.
 */

let nextEnemyId = 1;
let nextPickupId = 1;

function worldDimensionsFromViewport(viewportWidth, viewportHeight) {
  const scale = CONFIG.WORLD.viewportScale;
  return {
    worldWidth: viewportWidth * scale,
    worldHeight: viewportHeight * scale,
  };
}

function wallYFromViewport(viewportHeight) {
  return viewportHeight * CONFIG.WALL.yScreenRatio;
}

function playAreaBounds(viewportWidth) {
  const { leftRatio, rightRatio } = CONFIG.PLAY_AREA;
  return {
    playAreaLeft: viewportWidth * leftRatio,
    playAreaRight: viewportWidth * rightRatio,
  };
}

function syncPlayArea(state, viewportWidth) {
  const bounds = playAreaBounds(viewportWidth);
  state.playAreaLeft = bounds.playAreaLeft;
  state.playAreaRight = bounds.playAreaRight;
}

function clampXInPlayArea(state, x, radius) {
  const minX = state.playAreaLeft + radius;
  const maxX = state.playAreaRight - radius;
  return Math.min(maxX, Math.max(minX, x));
}

function clampEnemyPositions(state) {
  const { radius } = CONFIG.ENEMY;
  for (const enemy of state.enemies) {
    enemy.x = clampXInPlayArea(state, enemy.x, radius);
  }
}

function playerLaneY(wallY) {
  const { radius, standoffAboveWall } = CONFIG.PLAYER;
  return wallY - radius - standoffAboveWall;
}

function baseCastlePosition(worldWidth, viewportHeight, wallY) {
  return {
    x: worldWidth / 2,
    y: wallY + (viewportHeight - wallY) / 2,
  };
}

function playerStartPosition(worldWidth, wallY) {
  return {
    x: worldWidth / 2,
    y: playerLaneY(wallY),
  };
}

function wallTargetPoint(state) {
  return {
    x: state.worldWidth / 2,
    y: state.wallY,
  };
}

/** Camera top-left in world space; fixed when world matches viewport. */
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
  const wallY = wallYFromViewport(viewportHeight);

  const basePos = baseCastlePosition(worldWidth, viewportHeight, wallY);
  const base = {
    x: basePos.x,
    y: basePos.y,
    hp: CONFIG.BASE.maxHp,
    maxHp: CONFIG.BASE.maxHp,
  };

  const player = {
    ...playerStartPosition(worldWidth, wallY),
    hp: CONFIG.PLAYER.maxHp,
    maxHp: CONFIG.PLAYER.maxHp,
    fireCooldownRemaining: 0,
  };

  const gameState = {
    base,
    player,
    bullets: [],
    enemies: [],
    pickups: [],
    score: 0,
    wallY,
    wave: 1,
    spawnTimerRemaining: CONFIG.ENEMY.spawnIntervalSeconds,
    viewportWidth,
    viewportHeight,
    worldWidth,
    worldHeight,
    playAreaLeft: 0,
    playAreaRight: worldWidth,
  };

  syncPlayArea(gameState, viewportWidth);
  gameState.player.x = clampXInPlayArea(
    gameState,
    gameState.player.x,
    CONFIG.PLAYER.radius,
  );

  return gameState;
}

/** Re-anchor wall and player lane on resize; shift entities with wall movement. */
export function resizeGameState(state, viewportWidth, viewportHeight) {
  const { worldWidth, worldHeight } = worldDimensionsFromViewport(
    viewportWidth,
    viewportHeight,
  );
  const newWallY = wallYFromViewport(viewportHeight);
  const dy = newWallY - state.wallY;

  state.wallY = newWallY;
  const basePos = baseCastlePosition(worldWidth, viewportHeight, newWallY);
  state.base.x = basePos.x;
  state.base.y = basePos.y;
  state.player.y += dy;

  for (const enemy of state.enemies) {
    enemy.y += dy;
  }
  for (const bullet of state.bullets) {
    bullet.y += dy;
  }
  for (const pickup of state.pickups) {
    pickup.y += dy;
  }

  state.viewportWidth = viewportWidth;
  state.viewportHeight = viewportHeight;
  state.worldWidth = worldWidth;
  state.worldHeight = worldHeight;

  syncPlayArea(state, viewportWidth);
  clampPlayerToWorld(state);
  clampEnemyPositions(state);
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
  collectPickups(state);

  updateEnemies(state, deltaSeconds);
  clampEnemyPositions(state);
  resolveEnemyWallBreaches(state);
  resolveEnemyPlayerContact(state, deltaSeconds);
  updateAutoCombat(state, deltaSeconds);
  updateBullets(state, deltaSeconds);
}

function updateSpawns(state, deltaSeconds) {
  state.spawnTimerRemaining -= deltaSeconds;
  while (state.spawnTimerRemaining <= 0) {
    state.enemies.push(createEnemyAtTopEdge(state));
    state.wave += 1;
    state.spawnTimerRemaining += CONFIG.ENEMY.spawnIntervalSeconds;
  }
}

function createEnemyAtTopEdge(state) {
  const { radius } = CONFIG.ENEMY;
  const minX = state.playAreaLeft + radius;
  const maxX = state.playAreaRight - radius;

  return {
    id: nextEnemyId++,
    x: minX + Math.random() * (maxX - minX),
    y: -radius,
    hp: CONFIG.ENEMY.maxHp,
    maxHp: CONFIG.ENEMY.maxHp,
    playerContactCooldown: 0,
  };
}

function updateEnemies(state, deltaSeconds) {
  const { speed } = CONFIG.ENEMY;
  const wallPoint = wallTargetPoint(state);

  for (const enemy of state.enemies) {
    const target = pickEnemyTarget(state, enemy, wallPoint);
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

/** Move toward whichever of the wall center or player is closer. */
function pickEnemyTarget(state, enemy, wallPoint) {
  const toWall = Math.hypot(wallPoint.x - enemy.x, wallPoint.y - enemy.y);
  const toPlayer = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
  return toPlayer < toWall ? state.player : wallPoint;
}

function resolveEnemyWallBreaches(state) {
  const { radius, contactDamage } = CONFIG.ENEMY;
  const breachY = state.wallY - radius;

  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.y < breachY) return true;
    state.base.hp = Math.max(0, state.base.hp - contactDamage);
    return false;
  });
}

function resolveEnemyPlayerContact(state, deltaSeconds) {
  const { radius: enemyRadius, contactDamage, contactCooldownSeconds } =
    CONFIG.ENEMY;
  const playerRadius = CONFIG.PLAYER.radius;

  for (const enemy of state.enemies) {
    enemy.playerContactCooldown = Math.max(
      0,
      enemy.playerContactCooldown - deltaSeconds,
    );

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

  const survivingEnemies = [];
  for (const enemy of state.enemies) {
    if (enemy.hp > 0) {
      survivingEnemies.push(enemy);
      continue;
    }
    state.pickups.push({
      id: nextPickupId++,
      x: enemy.x,
      y: enemy.y,
    });
  }
  state.enemies = survivingEnemies;
}

function collectPickups(state) {
  const playerRadius = CONFIG.PLAYER.radius;
  const pickupRadius = CONFIG.PICKUP.radius;

  state.pickups = state.pickups.filter((pickup) => {
    const collected = circlesOverlap(
      state.player.x,
      state.player.y,
      playerRadius,
      pickup.x,
      pickup.y,
      pickupRadius,
    );
    if (collected) state.score += 1;
    return !collected;
  });
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const sum = r1 + r2;
  return dx * dx + dy * dy <= sum * sum;
}

function clampPlayerToWorld(state) {
  const r = CONFIG.PLAYER.radius;
  const laneY = playerLaneY(state.wallY);
  const minY = r;

  state.player.x = clampXInPlayArea(state, state.player.x, r);
  state.player.y = Math.min(laneY, Math.max(minY, state.player.y));
}
