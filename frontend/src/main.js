import { createGameState, resizeGameState, updateGameState } from './logic.js';
import { createInputController } from './input.js';
import { renderFrame } from './render.js';

/** Cap delta to avoid huge jumps after tab backgrounding. */
const MAX_DELTA_SECONDS = 0.05;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = createInputController(canvas);

let gameState = createGameState(1, 1);

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;

  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  resizeGameState(gameState, cssWidth, cssHeight);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTimestamp = performance.now();

function gameLoop(timestamp) {
  const deltaSeconds = Math.min(
    (timestamp - lastTimestamp) / 1000,
    MAX_DELTA_SECONDS,
  );
  lastTimestamp = timestamp;

  const movement = input.getMovementInput();
  updateGameState(gameState, deltaSeconds, movement);

  renderFrame(
    ctx,
    gameState.worldWidth,
    gameState.worldHeight,
    gameState,
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
