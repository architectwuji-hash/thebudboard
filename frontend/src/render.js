import { CONFIG } from './config.js';

/**
 * All canvas drawing lives in this module — one function per entity / UI piece.
 * Swap shape drawing for sprites later without touching logic.
 */

export function clearCanvas(ctx, width, height) {
  ctx.fillStyle = CONFIG.CANVAS.background;
  ctx.fillRect(0, 0, width, height);
}

export function drawPlayAreaCorridor(
  ctx,
  viewportWidth,
  viewportHeight,
  playAreaLeft,
  playAreaRight,
) {
  const { gutterFill, edgeLineColor, edgeLineWidth } = CONFIG.PLAY_AREA;

  ctx.fillStyle = gutterFill;
  ctx.fillRect(0, 0, playAreaLeft, viewportHeight);
  ctx.fillRect(playAreaRight, 0, viewportWidth - playAreaRight, viewportHeight);

  ctx.strokeStyle = edgeLineColor;
  ctx.lineWidth = edgeLineWidth;
  ctx.beginPath();
  ctx.moveTo(playAreaLeft, 0);
  ctx.lineTo(playAreaLeft, viewportHeight);
  ctx.moveTo(playAreaRight, 0);
  ctx.lineTo(playAreaRight, viewportHeight);
  ctx.stroke();
}

export function drawProtectedZone(ctx, viewportWidth, viewportHeight, wallY) {
  const { halfHeight } = CONFIG.WALL;
  const top = wallY + halfHeight;

  ctx.fillStyle = CONFIG.CANVAS.protectedZone;
  ctx.fillRect(0, top, viewportWidth, viewportHeight - top);
}

export function drawWall(ctx, wallY, worldWidth) {
  const {
    halfHeight,
    fill,
    borderColor,
    borderWidth,
    gateWidth,
    gateHeight,
    gateFill,
  } = CONFIG.WALL;

  const barTop = wallY - halfHeight;
  const barHeight = halfHeight * 2;

  ctx.fillStyle = fill;
  ctx.fillRect(0, barTop, worldWidth, barHeight);

  ctx.fillStyle = borderColor;
  ctx.fillRect(0, barTop - borderWidth, worldWidth, borderWidth);
  ctx.fillRect(0, barTop + barHeight, worldWidth, borderWidth);

  const gateX = worldWidth / 2 - gateWidth / 2;
  const gateY = barTop + (barHeight - gateHeight) / 2;
  ctx.fillStyle = gateFill;
  ctx.beginPath();
  ctx.roundRect(gateX, gateY, gateWidth, gateHeight, 6);
  ctx.fill();
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

export function drawEnemies(ctx, enemies, wallY) {
  const { radius, fill, stroke, strokeWidth, hpFont, hpColor } = CONFIG.ENEMY;
  const maxVisibleY = wallY - radius;

  for (const enemy of enemies) {
    if (enemy.y > maxVisibleY) continue;

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

export function drawBullets(ctx, bullets, wallY) {
  const { radius, fill, stroke, strokeWidth } = CONFIG.BULLET;

  for (const bullet of bullets) {
    if (bullet.y > wallY) continue;

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

export function drawWaveBadge(ctx, wave, viewportWidth) {
  const {
    waveLabel,
    waveBadgeFont,
    waveBadgeFill,
    waveBadgeStroke,
    waveBadgeText,
    waveBadgePaddingX,
    waveBadgePaddingY,
    waveBadgeRadius,
    paddingY,
  } = CONFIG.HUD;

  const text = `${waveLabel}: ${wave}`;
  ctx.font = waveBadgeFont;
  const textWidth = ctx.measureText(text).width;
  const badgeWidth = textWidth + waveBadgePaddingX * 2;
  const badgeHeight = 16 + waveBadgePaddingY * 2;
  const x = (viewportWidth - badgeWidth) / 2;
  const y = paddingY;

  ctx.fillStyle = waveBadgeFill;
  ctx.strokeStyle = waveBadgeStroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, badgeWidth, badgeHeight, waveBadgeRadius);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = waveBadgeText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + badgeWidth / 2, y + badgeHeight / 2);
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

export function renderFrame(
  ctx,
  viewportWidth,
  viewportHeight,
  gameState,
  camera,
  joystick,
) {
  clearCanvas(ctx, viewportWidth, viewportHeight);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawPlayAreaCorridor(
    ctx,
    viewportWidth,
    viewportHeight,
    gameState.playAreaLeft,
    gameState.playAreaRight,
  );
  drawProtectedZone(ctx, viewportWidth, viewportHeight, gameState.wallY);
  drawWall(ctx, gameState.wallY, gameState.worldWidth);
  drawBase(ctx, gameState.base);
  drawEnemies(ctx, gameState.enemies, gameState.wallY);
  drawBullets(ctx, gameState.bullets, gameState.wallY);
  drawPlayer(ctx, gameState.player);
  ctx.restore();

  drawHud(ctx, gameState.base, gameState.player);
  drawWaveBadge(ctx, gameState.wave, viewportWidth);
  drawVirtualJoystick(ctx, joystick);
}
