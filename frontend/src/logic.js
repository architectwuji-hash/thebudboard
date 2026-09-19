import { CONFIG } from './config.js';

/**
 * Pure game logic — updates state only; never touches the canvas.
 */

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
    fireCooldownRemaining: 0,
  };

  return {
    base,
    player,
    bullets: [],
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
 * @param {{ aimX: number, aimY: number, fire: boolean }} combat
 */
export function updateGameState(state, deltaSeconds, movement, combat) {
  const { speed } = CONFIG.PLAYER;
  const moveX = movement.axisX * speed * deltaSeconds;
  const moveY = movement.axisY * speed * deltaSeconds;

  state.player.x += moveX;
  state.player.y += moveY;

  clampPlayerToWorld(state);

  state.player.fireCooldownRemaining = Math.max(
    0,
    state.player.fireCooldownRemaining - deltaSeconds,
  );

  if (combat.fire && state.player.fireCooldownRemaining <= 0) {
    spawnBullet(state, combat.aimX, combat.aimY);
    state.player.fireCooldownRemaining = CONFIG.PLAYER.fireCooldownSeconds;
  }

  updateBullets(state, deltaSeconds);
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
  const { speed, cullMargin } = CONFIG.BULLET;
  const maxX = state.worldWidth + cullMargin;
  const maxY = state.worldHeight + cullMargin;
  const min = -cullMargin;

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * speed * deltaSeconds;
    bullet.y += bullet.vy * speed * deltaSeconds;
  }

  state.bullets = state.bullets.filter(
    (b) => b.x >= min && b.x <= maxX && b.y >= min && b.y <= maxY,
  );
}

function clampPlayerToWorld(state) {
  const r = CONFIG.PLAYER.radius;
  const maxX = state.worldWidth - r;
  const maxY = state.worldHeight - r;

  state.player.x = Math.min(maxX, Math.max(r, state.player.x));
  state.player.y = Math.min(maxY, Math.max(r, state.player.y));
}
