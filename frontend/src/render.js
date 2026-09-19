import { CONFIG } from './config.js';
import {
  getShopLayout,
  getUpgradeCost,
  getNextLevelDescription,
  listShopPowerIds,
  getPowerDefinition,
} from './shop.js';
import { computeTopHudLayout } from './hudLayout.js';

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

export function drawPickups(ctx, pickups, wallY) {
  const { radius, fill, stroke, strokeWidth } = CONFIG.PICKUP;

  for (const pickup of pickups) {
    if (pickup.y > wallY) continue;

    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
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

function drawHudBadge(ctx, text, centerX, y) {
  const {
    waveBadgeFont,
    waveBadgeFill,
    waveBadgeStroke,
    waveBadgeText,
    waveBadgePaddingX,
    waveBadgePaddingY,
    waveBadgeRadius,
  } = CONFIG.HUD;

  ctx.font = waveBadgeFont;
  const textWidth = ctx.measureText(text).width;
  const badgeWidth = textWidth + waveBadgePaddingX * 2;
  const badgeHeight = 16 + waveBadgePaddingY * 2;
  const x = centerX - badgeWidth / 2;

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
  ctx.fillText(text, centerX, y + badgeHeight / 2);

  return { badgeWidth, badgeHeight };
}

export function drawWaveAndScoreBadges(ctx, wave, score, viewportWidth, base, player) {
  const hud = computeTopHudLayout(ctx, viewportWidth, base, player, wave, score);
  const { metrics, badgeY, startX } = hud;
  const { badgeGap, waveText, scoreText, waveWidth, scoreWidth } = metrics;

  drawHudBadge(ctx, waveText, startX + waveWidth / 2, badgeY);
  drawHudBadge(
    ctx,
    scoreText,
    startX + waveWidth + badgeGap + scoreWidth / 2,
    badgeY,
  );
}

function drawRoundedButton(ctx, rect, label, styles) {
  const { fill, stroke, text, font, radius } = styles;
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
}

export function drawShopButton(ctx, viewportWidth, viewportHeight, gameState) {
  const layout = getShopLayout(viewportWidth, viewportHeight, ctx, gameState);
  drawRoundedButton(ctx, layout.shopButton, CONFIG.SHOP.button.label, {
    fill: CONFIG.SHOP.button.fill,
    stroke: CONFIG.SHOP.button.stroke,
    text: CONFIG.SHOP.button.text,
    font: CONFIG.SHOP.button.font,
    radius: CONFIG.SHOP.button.radius,
  });
}

export function drawUpgradeBuffIcons(ctx, upgrades, anchorX, anchorY) {
  const { buffIconSize, buffIconGap, powers } = CONFIG.SHOP;
  let x = anchorX;

  for (const powerId of listShopPowerIds()) {
    const level = upgrades[powerId] ?? 0;
    if (level <= 0) continue;

    const accent = powers[powerId].accent;
    ctx.beginPath();
    ctx.arc(x + buffIconSize, anchorY, buffIconSize, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(level), x + buffIconSize, anchorY);
    x += buffIconSize * 2 + buffIconGap;
  }
}

export function drawShopOverlay(ctx, gameState, viewportWidth, viewportHeight) {
  if (!gameState.shopOpen) return;

  const layout = getShopLayout(viewportWidth, viewportHeight, ctx, gameState);
  const overlay = CONFIG.SHOP.overlay;

  ctx.fillStyle = overlay.dim;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.fillStyle = overlay.panelFill;
  ctx.strokeStyle = overlay.panelStroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(
    layout.panel.x,
    layout.panel.y,
    layout.panel.width,
    layout.panel.height,
    overlay.panelRadius,
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = overlay.titleColor;
  ctx.font = overlay.titleFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `Shop — Score: ${gameState.score}`,
    viewportWidth / 2,
    layout.panel.y + 16,
  );

  const powerIds = listShopPowerIds();
  for (let i = 0; i < powerIds.length; i++) {
    const powerId = powerIds[i];
    const power = getPowerDefinition(powerId);
    const row = layout.rows[i];
    const level = gameState.upgrades[powerId] ?? 0;
    const cost = getUpgradeCost(powerId, level);
    const nextDesc = getNextLevelDescription(powerId, level);

    ctx.fillStyle = overlay.rowFill;
    ctx.strokeStyle = overlay.rowStroke;
    ctx.beginPath();
    ctx.roundRect(row.x, row.y, row.width, row.height, overlay.rowRadius);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = power.accent;
    ctx.fillRect(row.x, row.y, 4, row.height);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = overlay.rowColor;
    ctx.font = overlay.rowFont;
    ctx.fillText(
      `${power.name}  Lv ${level}/${CONFIG.SHOP.maxLevel}`,
      row.x + 12,
      row.y + 8,
    );

    ctx.fillStyle = overlay.detailColor;
    ctx.font = overlay.detailFont;
    const detail =
      cost === null
        ? 'Max level reached'
        : `${nextDesc} — Buy: ${cost} pts`;
    ctx.fillText(detail, row.x + 12, row.y + 28);
  }

  drawRoundedButton(
    ctx,
    layout.resumeButton,
    overlay.resumeLabel,
    {
      fill: overlay.resumeFill,
      stroke: 'rgba(21, 128, 61, 0.8)',
      text: overlay.resumeText,
      font: '700 15px system-ui, sans-serif',
      radius: 8,
    },
  );
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
  drawPickups(ctx, gameState.pickups, gameState.wallY);
  drawBullets(ctx, gameState.bullets, gameState.wallY);
  drawPlayer(ctx, gameState.player);
  ctx.restore();

  drawHud(ctx, gameState.base, gameState.player);
  drawWaveAndScoreBadges(
    ctx,
    gameState.wave,
    gameState.score,
    viewportWidth,
    gameState.base,
    gameState.player,
  );
  drawUpgradeBuffIcons(
    ctx,
    gameState.upgrades,
    CONFIG.HUD.paddingX,
    CONFIG.HUD.paddingY + CONFIG.HUD.lineHeight * 2 + CONFIG.HUD.hudBadgeRowGap + 28,
  );
  drawShopButton(ctx, viewportWidth, viewportHeight, gameState);
  drawShopOverlay(ctx, gameState, viewportWidth, viewportHeight);
  drawVirtualJoystick(ctx, joystick);
}
