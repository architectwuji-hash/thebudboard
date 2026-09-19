import {
  createGameState,
  getCamera,
  resizeGameState,
  updateGameState,
} from './logic.js';
import { createInputController } from './input.js';
import { renderFrame } from './render.js';
import { handleShopPointer } from './shop.js';

/** Cap delta to avoid huge jumps after tab backgrounding. */
const MAX_DELTA_SECONDS = 0.05;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = createInputController(canvas);

let gameState = createGameState(1, 1);

input.bindShopHandlers({
  onPointer: (x, y, vw, vh) =>
    handleShopPointer(gameState, x, y, vw, vh, ctx),
});

window.addEventListener('keydown', (e) => {
  input.handleShopKeys(gameState, e);
});
/** CSS-pixel viewport; matches canvas.width / canvas.height after resize. */
let viewportWidth = 1;
let viewportHeight = 1;

function resizeCanvas() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  canvas.width = viewportWidth;
  canvas.height = viewportHeight;

  ctx.setTransform(1, 0, 0, 1, 0, 0);

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

  const movement = gameState.shopOpen
    ? { axisX: 0, axisY: 0 }
    : input.getMovementInput();
  updateGameState(gameState, deltaSeconds, movement);

  const camera = getCamera(gameState, viewportWidth, viewportHeight);

  renderFrame(
    ctx,
    viewportWidth,
    viewportHeight,
    gameState,
    camera,
    input.joystick,
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Prevent accidental iOS bounce while playing.
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.target === canvas) e.preventDefault();
  },
  { passive: false },
);
