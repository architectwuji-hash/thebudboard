import {
  createGameState,
  getCamera,
  resizeGameState,
  updateGameState,
} from './logic.js';
import { createInputController } from './input.js';
import { renderFrame } from './render.js';

/** Cap delta to avoid huge jumps after tab backgrounding. */
const MAX_DELTA_SECONDS = 0.05;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = createInputController(canvas);

let gameState = createGameState(1, 1);
let viewportWidth = 1;
let viewportHeight = 1;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  resizeGameState(gameState, viewportWidth, viewportHeight);
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
