import { CONFIG } from './config.js';

/**
 * Keyboard (desktop) + virtual joystick (left half of screen, touch devices).
 * Exposes normalized movement axes for logic — no rendering here.
 */

const KEY_MAP = {
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const FIRE_KEYS = new Set(['Space']);

export function createInputController(canvas) {
  const keysDown = new Set();
  let pointerX = null;
  let pointerY = null;
  let mouseFireHeld = false;
  let touchFireHeld = false;
  let lastAimX = CONFIG.PLAYER.defaultAimX;
  let lastAimY = CONFIG.PLAYER.defaultAimY;

  const joystick = {
    active: false,
    originX: 0,
    originY: 0,
    stickX: 0,
    stickY: 0,
    axisX: 0,
    axisY: 0,
  };

  window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.code]) {
      keysDown.add(e.code);
      e.preventDefault();
    }
    if (FIRE_KEYS.has(e.code)) {
      keysDown.add(e.code);
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });

  canvas.addEventListener('mousemove', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    pointerX = e.clientX;
    pointerY = e.clientY;
    mouseFireHeld = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseFireHeld = false;
  });

  canvas.addEventListener(
    'touchstart',
    (e) => {
      for (const touch of e.changedTouches) {
        if (isInJoystickZone(touch.clientX, canvas.clientWidth)) {
          activateJoystick(joystick, touch.clientX, touch.clientY);
          e.preventDefault();
          continue;
        }
        pointerX = touch.clientX;
        pointerY = touch.clientY;
        touchFireHeld = true;
        e.preventDefault();
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      for (const touch of e.changedTouches) {
        if (joystick.active && isInJoystickZone(touch.clientX, canvas.clientWidth)) {
          updateJoystickVector(joystick, touch.clientX, touch.clientY);
          e.preventDefault();
          continue;
        }
        if (!isInJoystickZone(touch.clientX, canvas.clientWidth)) {
          pointerX = touch.clientX;
          pointerY = touch.clientY;
          touchFireHeld = true;
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  const endTouch = (e) => {
    for (const touch of e.changedTouches) {
      if (joystick.active) {
        resetJoystick(joystick);
        e.preventDefault();
      }
      if (!isInJoystickZone(touch.clientX, canvas.clientWidth)) {
        touchFireHeld = false;
      }
    }
  };

  canvas.addEventListener('touchend', endTouch, { passive: false });
  canvas.addEventListener('touchcancel', endTouch, { passive: false });

  return {
    joystick,
    getMovementInput() {
      let axisX = 0;
      let axisY = 0;

      for (const code of keysDown) {
        const vec = KEY_MAP[code];
        if (!vec) continue;
        axisX += vec.x;
        axisY += vec.y;
      }

      if (joystick.active) {
        axisX += joystick.axisX;
        axisY += joystick.axisY;
      }

      return normalizeAxes(axisX, axisY);
    },
    getAimDirection(fromX, fromY) {
      if (pointerX != null && pointerY != null) {
        const rect = canvas.getBoundingClientRect();
        const worldX = pointerX - rect.left;
        const worldY = pointerY - rect.top;
        const dx = worldX - fromX;
        const dy = worldY - fromY;
        const len = Math.hypot(dx, dy);
        if (len > 0.001) {
          lastAimX = dx / len;
          lastAimY = dy / len;
        }
      } else {
        const movement = this.getMovementInput();
        if (movement.axisX !== 0 || movement.axisY !== 0) {
          lastAimX = movement.axisX;
          lastAimY = movement.axisY;
        }
      }

      return { aimX: lastAimX, aimY: lastAimY };
    },
    isFireHeld() {
      for (const code of FIRE_KEYS) {
        if (keysDown.has(code)) return true;
      }
      return mouseFireHeld || touchFireHeld;
    },
  };
}

function isInJoystickZone(clientX, canvasWidth) {
  return clientX <= canvasWidth * CONFIG.JOYSTICK.zoneWidthRatio;
}

function activateJoystick(joystick, clientX, clientY) {
  joystick.active = true;
  joystick.originX = clientX;
  joystick.originY = clientY;
  joystick.stickX = clientX;
  joystick.stickY = clientY;
  joystick.axisX = 0;
  joystick.axisY = 0;
}

function updateJoystickVector(joystick, clientX, clientY) {
  const { maxRadius, deadZone } = CONFIG.JOYSTICK;
  let dx = clientX - joystick.originX;
  let dy = clientY - joystick.originY;
  const dist = Math.hypot(dx, dy);

  if (dist > maxRadius) {
    const scale = maxRadius / dist;
    dx *= scale;
    dy *= scale;
  }

  joystick.stickX = joystick.originX + dx;
  joystick.stickY = joystick.originY + dy;

  const normX = dx / maxRadius;
  const normY = dy / maxRadius;
  const magnitude = Math.hypot(normX, normY);

  if (magnitude < deadZone) {
    joystick.axisX = 0;
    joystick.axisY = 0;
    return;
  }

  joystick.axisX = normX;
  joystick.axisY = normY;
}

function resetJoystick(joystick) {
  joystick.active = false;
  joystick.axisX = 0;
  joystick.axisY = 0;
}

function normalizeAxes(axisX, axisY) {
  const len = Math.hypot(axisX, axisY);
  if (len === 0) return { axisX: 0, axisY: 0 };
  return { axisX: axisX / len, axisY: axisY / len };
}
