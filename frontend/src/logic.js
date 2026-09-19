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
  };

  return { base, player, worldWidth: width, worldHeight: height };
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
 * @param {{ axisX: number, axisY: number }} input — normalized movement, -1..1
 */
export function updateGameState(state, deltaSeconds, input) {
  const { speed } = CONFIG.PLAYER;
  const moveX = input.axisX * speed * deltaSeconds;
  const moveY = input.axisY * speed * deltaSeconds;

  state.player.x += moveX;
  state.player.y += moveY;

  clampPlayerToWorld(state);
}

function clampPlayerToWorld(state) {
  const r = CONFIG.PLAYER.radius;
  const maxX = state.worldWidth - r;
  const maxY = state.worldHeight - r;

  state.player.x = Math.min(maxX, Math.max(r, state.player.x));
  state.player.y = Math.min(maxY, Math.max(r, state.player.y));
}
