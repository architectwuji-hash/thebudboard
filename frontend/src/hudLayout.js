import { CONFIG } from './config.js';

function measureLeftHudWidth(ctx, base, player) {
  const { baseLabel, playerLabel, font } = CONFIG.HUD;
  ctx.font = font;
  const baseLine = `${baseLabel}: ${Math.round(base.hp)}`;
  const playerLine = `${playerLabel}: ${Math.round(player.hp)}`;
  return Math.max(ctx.measureText(baseLine).width, ctx.measureText(playerLine).width);
}

function waveScoreBadgeMetrics(ctx, wave, score) {
  const { waveLabel, scoreLabel, waveBadgeFont, waveBadgePaddingX } = CONFIG.HUD;
  const badgeGap = 12;
  const waveText = `${waveLabel}: ${wave}`;
  const scoreText = `${scoreLabel}: ${score}`;

  ctx.font = waveBadgeFont;
  const waveWidth = ctx.measureText(waveText).width + waveBadgePaddingX * 2;
  const scoreWidth = ctx.measureText(scoreText).width + waveBadgePaddingX * 2;
  return {
    badgeGap,
    waveText,
    scoreText,
    waveWidth,
    scoreWidth,
    totalWidth: waveWidth + badgeGap + scoreWidth,
  };
}

/** Shared placement for wave/score badges and shop button anchor. */
export function computeTopHudLayout(ctx, viewportWidth, base, player, wave, score) {
  const { paddingX, paddingY, lineHeight, hudElementGap, hudBadgeRowGap, waveBadgePaddingY } =
    CONFIG.HUD;
  const metrics = waveScoreBadgeMetrics(ctx, wave, score);
  const { waveWidth, scoreWidth, totalWidth } = metrics;
  const badgeHeight = 16 + waveBadgePaddingY * 2;

  const leftBlockRight = paddingX + measureLeftHudWidth(ctx, base, player);

  let badgeY = paddingY;
  let startX = (viewportWidth - totalWidth) / 2;

  const overlapsLeft = startX < leftBlockRight + hudElementGap;
  if (overlapsLeft) {
    startX = Math.max(paddingX, viewportWidth - paddingX - totalWidth);
  }

  const stillOverlapsLeft = startX < leftBlockRight + hudElementGap;
  if (stillOverlapsLeft) {
    badgeY = paddingY + lineHeight * 2 + hudBadgeRowGap;
    startX = Math.max(paddingX, (viewportWidth - totalWidth) / 2);
  }

  const scoreBadgeRight = startX + totalWidth;
  const badgeBottom = badgeY + badgeHeight;

  return {
    metrics,
    badgeY,
    badgeHeight,
    startX,
    scoreBadgeRight,
    badgeBottom,
  };
}

export function computeShopButtonRect(ctx, viewportWidth, base, player, wave, score) {
  const { button } = CONFIG.SHOP;
  const hud = computeTopHudLayout(ctx, viewportWidth, base, player, wave, score);

  return {
    x: viewportWidth - button.margin - button.width,
    y: hud.badgeBottom + button.gapBelowPoints,
    width: button.width,
    height: button.height,
  };
}
