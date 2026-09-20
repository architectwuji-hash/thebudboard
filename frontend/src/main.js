import { CONFIG } from './config.js';
import {
  createGameState,
  getCamera,
  resizeGameState,
  updateGameState,
} from './logic.js';
import { createInputController } from './input.js';
import {
  createRenderer,
  createSceneGraph,
  renderOverlayFrame,
  renderWorldFrame,
} from './render.js';
import { handleShopPointer } from './shop.js';

const MAX_DELTA_SECONDS = 0.05;

const canvas = document.getElementById('game');
const uiCanvas = document.getElementById('ui-overlay');
const uiCtx = uiCanvas.getContext('2d');

const waveEl = document.getElementById('hud-wave');
const scoreEl = document.getElementById('hud-score');
const baseHpEl = document.getElementById('hud-base-hp');
const playerHpEl = document.getElementById('hud-player-hp');

const gameOverEl = document.getElementById('game-over');
const gameOverTitleEl = document.getElementById('game-over-title');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverScoreEl = document.getElementById('game-over-score');
const gameOverHintEl = document.getElementById('game-over-hint');

const { title, message, restartHint } = CONFIG.GAME_OVER;
gameOverTitleEl.textContent = title;
gameOverMessageEl.textContent = message;
gameOverHintEl.textContent = restartHint;

const renderer = createRenderer(canvas);
const sceneGraph = createSceneGraph();
const input = createInputController(canvas);

let gameState = createGameState(1, 1);

input.bindShopHandlers({
  onPointer: (x, y, vw, vh) => {
    if (gameState.gameOver) return false;
    return handleShopPointer(gameState, x, y, vw, vh, uiCtx);
  },
});

window.addEventListener('keydown', (e) => {
  if (gameState.gameOver && e.type === 'keydown' && e.code === 'Enter') {
    restartRun();
    e.preventDefault();
    return;
  }
  input.handleShopKeys(gameState, e);
});

function restartRun() {
  gameState = createGameState(viewportWidth, viewportHeight);
  gameOverEl.classList.add('hidden');
}

gameOverEl.addEventListener('click', () => {
  if (gameState.gameOver) restartRun();
});

let viewportWidth = 1;
let viewportHeight = 1;

function updateDomHud(state) {
  const { waveLabel, scoreLabel, baseLabel, playerLabel } = CONFIG.HUD;
  waveEl.textContent = `${waveLabel}: ${state.wave}`;
  scoreEl.textContent = `${scoreLabel}: ${state.score}`;
  baseHpEl.textContent = `${baseLabel}: ${Math.max(0, Math.round(state.base.hp))}`;
  playerHpEl.textContent = `${playerLabel}: ${Math.round(state.player.hp)}`;

  if (state.gameOver) {
    gameOverScoreEl.textContent = `${scoreLabel}: ${state.score} · ${waveLabel}: ${state.wave}`;
    gameOverEl.classList.remove('hidden');
  } else {
    gameOverEl.classList.add('hidden');
  }
}

function resizeCanvas() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  uiCanvas.width = viewportWidth;
  uiCanvas.height = viewportHeight;

  renderer.setSize(viewportWidth, viewportHeight, false);
  resizeGameState(gameState, viewportWidth, viewportHeight);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
  window.visualViewport.addEventListener('scroll', resizeCanvas);
}
resizeCanvas();

let lastTimestamp = performance.now();

function gameLoop(timestamp) {
  const deltaSeconds = Math.min(
    (timestamp - lastTimestamp) / 1000,
    MAX_DELTA_SECONDS,
  );
  lastTimestamp = timestamp;

  const movement =
    gameState.gameOver || gameState.shopOpen
      ? { axisX: 0, axisY: 0 }
      : input.getMovementInput();
  updateGameState(gameState, deltaSeconds, movement);

  const camera = getCamera(gameState, viewportWidth, viewportHeight);
  updateDomHud(gameState);

  renderWorldFrame(
    renderer,
    sceneGraph,
    gameState,
    camera,
    viewportWidth,
    viewportHeight,
  );

  renderOverlayFrame(
    uiCtx,
    viewportWidth,
    viewportHeight,
    gameState,
    input.joystick,
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

document.addEventListener(
  'touchmove',
  (e) => {
    if (e.target === canvas || e.target === uiCanvas) e.preventDefault();
  },
  { passive: false },
);
