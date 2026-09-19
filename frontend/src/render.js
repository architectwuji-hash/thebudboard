import { CONFIG } from './config.js';

/**
 * All canvas drawing lives in this module — one function per entity / UI piece.
 * Swap shape drawing for sprites later without touching logic.
 */

export function clearCanvas(ctx, width, height) {
  ctx.fillStyle = CONFIG.CANVAS.background;
  ctx.fillRect(0, 0, width, height);
}

export function drawBase(ctx, base) {
  const { radius, fill, stroke, strokeWidth, hpFont, hpColor } = CONFIG.BASE;

  ctx.beginPath();
  ctx.arc(base.x, base.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  ctx.font = hpFont;
  ctx.fillStyle = hpColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(base.hp)), base.x, base.y);
}

export function drawPlayer(ctx, player) {
  const { radius, fill, stroke, strokeWidth } = CONFIG.PLAYER;

  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

export function drawEnemies(ctx, enemies) {
  const { radius, fill, stroke, strokeWidth, hpFont, hpColor } = CONFIG.ENEMY;

  for (const enemy of enemies) {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    ctx.font = hpFont;
    ctx.fillStyle = hpColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.max(0, Math.round(enemy.hp))), enemy.x, enemy.y);
  }
}

export function drawBullets(ctx, bullets) {
  const { radius, fill, stroke, strokeWidth } = CONFIG.BULLET;

  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function drawHud(ctx, base, player) {
  const {
    baseLabel,
    playerLabel,
    font,
    color,
    shadowColor,
    paddingX,
    paddingY,
    lineHeight,
  } = CONFIG.HUD;

  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 4;
  ctx.fillStyle = color;
  ctx.fillText(
    `${baseLabel}: ${Math.round(base.hp)}`,
    paddingX,
    paddingY,
  );
  ctx.fillText(
    `${playerLabel}: ${Math.round(player.hp)}`,
    paddingX,
    paddingY + lineHeight,
  );
  ctx.shadowBlur = 0;
}

/** Optional mobile joystick overlay (drawn only while active). */
export function drawVirtualJoystick(ctx, joystick) {
  if (!joystick.active) return;

  const { baseFill, baseStroke, stickFill, stickStroke, stickRadius, maxRadius } =
    CONFIG.JOYSTICK;

  ctx.beginPath();
  ctx.arc(joystick.originX, joystick.originY, maxRadius, 0, Math.PI * 2);
  ctx.fillStyle = baseFill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = baseStroke;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(joystick.stickX, joystick.stickY, stickRadius, 0, Math.PI * 2);
  ctx.fillStyle = stickFill;
  ctx.fill();
  ctx.strokeStyle = stickStroke;
  ctx.stroke();
}

export function renderFrame(ctx, width, height, gameState, joystick) {
  clearCanvas(ctx, width, height);
  drawBase(ctx, gameState.base);
  drawEnemies(ctx, gameState.enemies);
  drawBullets(ctx, gameState.bullets);
  drawPlayer(ctx, gameState.player);
  drawHud(ctx, gameState.base, gameState.player);
  drawVirtualJoystick(ctx, joystick);
}
