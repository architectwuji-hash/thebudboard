import { CONFIG } from './config.js';
import { handleShopPointer, toggleShopOpen } from './shop.js';

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

export function createInputController(canvas) {
  const keysDown = new Set();

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
    if (e.code === 'KeyB' || e.code === 'Escape') {
      e.preventDefault();
      return;
    }
    if (KEY_MAP[e.code]) {
      keysDown.add(e.code);
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
  });

  canvas.addEventListener(
    'touchstart',
    (e) => {
      for (const touch of e.changedTouches) {
        if (
          shopPointerHandler?.(touch.clientX, touch.clientY, canvas.clientWidth, canvas.clientHeight)
        ) {
          e.preventDefault();
          continue;
        }
        if (isInJoystickZone(touch.clientX, canvas.clientWidth)) {
          activateJoystick(joystick, touch.clientX, touch.clientY);
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  canvas.addEventListener('mousedown', (e) => {
    if (
      shopPointerHandler?.(e.clientX, e.clientY, canvas.clientWidth, canvas.clientHeight)
    ) {
      e.preventDefault();
    }
  });

  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (!joystick.active) return;
      for (const touch of e.changedTouches) {
        updateJoystickVector(joystick, touch.clientX, touch.clientY);
      }
      e.preventDefault();
    },
    { passive: false },
  );

  const endTouch = (e) => {
    for (const touch of e.changedTouches) {
      if (joystick.active) {
        resetJoystick(joystick);
        e.preventDefault();
      }
    }
  };

  canvas.addEventListener('touchend', endTouch, { passive: false });
  canvas.addEventListener('touchcancel', endTouch, { passive: false });

  let shopPointerHandler = null;

  return {
    joystick,
    bindShopHandlers({ onPointer }) {
      shopPointerHandler = onPointer;
    },
    handleShopKeys(state, e) {
      if (e.code !== 'KeyB' && e.code !== 'Escape') return false;
      if (e.type === 'keydown') {
        if (e.code === 'Escape' && state.shopOpen) {
          state.shopOpen = false;
        } else if (e.code === 'KeyB') {
          toggleShopOpen(state);
        }
        e.preventDefault();
        return true;
      }
      return false;
    },
    getMovementInput() {
      let axisX = 0;
      let axisY = 0;

      for (const code of keysDown) {
        const vec = KEY_MAP[code];
        axisX += vec.x;
        axisY += vec.y;
      }

      if (joystick.active) {
        axisX += joystick.axisX;
        axisY += joystick.axisY;
      }

      return normalizeAxes(axisX, axisY);
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
