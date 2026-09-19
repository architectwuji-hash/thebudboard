import * as THREE from 'three';
import { CapsuleGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CONFIG } from './config.js';
import {
  getShopLayout,
  getUpgradeCost,
  getNextLevelDescription,
  listShopPowerIds,
  getPowerDefinition,
} from './shop.js';

/**
 * WebGL world + screen-space 2D overlay (shop / joystick). Logic never draws.
 */

const R3 = CONFIG.RENDER3D;

function pxToWorld(px) {
  return px * CONFIG.WORLD.scale3d;
}

/** View-space pixel coords (after camera scroll) → Three.js XZ. */
function viewToWorld(viewX, viewY, viewportWidth, viewportHeight) {
  return {
    x: (viewX - viewportWidth * 0.5) * CONFIG.WORLD.scale3d,
    z: (viewY - viewportHeight * 0.5) * CONFIG.WORLD.scale3d,
  };
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = R3.toneMappingExposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(R3.clearColor, 1);
  return renderer;
}

export function createSceneGraph() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.WORLD.fogColor);
  scene.fog = new THREE.FogExp2(CONFIG.WORLD.fogColor, CONFIG.WORLD.fogDensity);

  const camera = new THREE.PerspectiveCamera(R3.cameraFov, 1, 0.1, 800);

  scene.add(
    new THREE.AmbientLight(R3.ambientColor, R3.ambientIntensity),
  );

  const keyLight = new THREE.DirectionalLight(
    R3.keyLightColor,
    R3.keyLightIntensity,
  );
  keyLight.position.set(10, 22, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(
    R3.rimLightColor,
    R3.rimLightIntensity,
  );
  rimLight.position.set(-12, 16, -10);
  scene.add(rimLight);

  scene.add(
    new THREE.HemisphereLight(
      R3.hemisphereSkyColor,
      R3.hemisphereGroundColor,
      R3.hemisphereIntensity,
    ),
  );

  const floorMat = new THREE.MeshStandardMaterial({
    color: R3.floorColor,
    roughness: 0.92,
    metalness: 0.04,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gutterMat = new THREE.MeshStandardMaterial({
    color: R3.gutterColor,
    roughness: 0.95,
    metalness: 0.02,
  });
  const leftGutter = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), gutterMat);
  const rightGutter = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), gutterMat);
  leftGutter.rotation.x = -Math.PI / 2;
  rightGutter.rotation.x = -Math.PI / 2;
  scene.add(leftGutter, rightGutter);

  const protectedMat = new THREE.MeshStandardMaterial({
    color: R3.protectedColor,
    roughness: 0.9,
    metalness: 0.03,
  });
  const protectedZone = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), protectedMat);
  protectedZone.rotation.x = -Math.PI / 2;
  scene.add(protectedZone);

  const wallMat = new THREE.MeshStandardMaterial({
    color: R3.wallColor,
    roughness: R3.wallRoughness,
    metalness: R3.wallMetalness,
  });
  const wall = new THREE.Mesh(
    new RoundedBoxGeometry(1, 1, 0.25, 4, 0.05),
    wallMat,
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  const baseMat = new THREE.MeshStandardMaterial({
    color: R3.baseColor,
    emissive: R3.baseEmissive,
    emissiveIntensity: R3.baseEmissiveIntensity,
    roughness: R3.roughnessDefault,
    metalness: R3.metalnessDefault,
  });
  const baseMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), baseMat);
  baseMesh.castShadow = true;
  scene.add(baseMesh);

  const basePulseLight = new THREE.PointLight(
    R3.pulseLightColor,
    R3.pulseLightMin,
    14,
  );
  scene.add(basePulseLight);

  const playerMat = new THREE.MeshStandardMaterial({
    color: R3.playerColor,
    emissive: R3.playerEmissive,
    emissiveIntensity: R3.playerEmissiveIntensity,
    roughness: R3.roughnessDefault,
    metalness: R3.metalnessDefault,
  });
  const playerMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), playerMat);
  playerMesh.castShadow = true;
  scene.add(playerMesh);

  const enemyGeo = new CapsuleGeometry(
    R3.capsuleEnemyRadius,
    R3.capsuleEnemyLength,
    6,
    12,
  );
  const enemyMat = new THREE.MeshStandardMaterial({
    color: R3.enemyColor,
    emissive: R3.enemyEmissive,
    emissiveIntensity: R3.enemyEmissiveIntensity,
    roughness: R3.roughnessDefault,
    metalness: R3.metalnessDefault,
  });

  const bulletGeo = new CapsuleGeometry(
    R3.capsuleBulletRadius,
    R3.capsuleBulletLength,
    4,
    8,
  );
  const bulletMat = new THREE.MeshStandardMaterial({
    color: R3.bulletColor,
    emissive: R3.bulletEmissive,
    emissiveIntensity: R3.bulletEmissiveIntensity,
    roughness: 0.22,
    metalness: 0.06,
  });

  const pickupMat = new THREE.MeshStandardMaterial({
    color: R3.pickupColor,
    emissive: R3.pickupEmissive,
    emissiveIntensity: R3.pickupEmissiveIntensity,
    roughness: 0.28,
    metalness: 0.45,
  });

  const enemyMeshes = new Map();
  const bulletMeshes = new Map();
  const pickupMeshes = new Map();
  let enemyInstanced = null;
  const dummy = new THREE.Object3D();

  function ensureEnemyPool(count) {
    if (count > R3.enemyInstancedThreshold) {
      if (!enemyInstanced) {
        enemyInstanced = new THREE.InstancedMesh(enemyGeo, enemyMat, 160);
        enemyInstanced.castShadow = true;
        scene.add(enemyInstanced);
      }
      for (const mesh of enemyMeshes.values()) scene.remove(mesh);
      enemyMeshes.clear();
      return;
    }
    if (enemyInstanced) {
      scene.remove(enemyInstanced);
      enemyInstanced = null;
    }
  }

  return {
    scene,
    camera,
    floor,
    leftGutter,
    rightGutter,
    protectedZone,
    wall,
    baseMesh,
    basePulseLight,
    playerMesh,
    enemyGeo,
    enemyMat,
    enemyMeshes,
    get enemyInstanced() {
      return enemyInstanced;
    },
    ensureEnemyPool,
    bulletGeo,
    bulletMat,
    bulletMeshes,
    pickupMat,
    pickupMeshes,
    dummy,
  };
}

function layoutCamera(camera, viewportWidth, viewportHeight, cameraScroll) {
  const worldW = pxToWorld(viewportWidth);
  const worldH = pxToWorld(viewportHeight);
  const tilt = (R3.cameraTiltDeg * Math.PI) / 180;
  const dist = Math.max(worldW, worldH) * R3.cameraDistanceScale;

  const focusViewX = cameraScroll.x + viewportWidth / 2;
  const focusViewY = cameraScroll.y + viewportHeight / 2;
  const focus = viewToWorld(focusViewX, focusViewY, viewportWidth, viewportHeight);

  camera.aspect = viewportWidth / viewportHeight;
  camera.updateProjectionMatrix();
  camera.position.set(
    focus.x,
    Math.sin(tilt) * dist,
    focus.z + Math.cos(tilt) * dist,
  );
  camera.lookAt(focus.x, 0, focus.z);
}

function syncEnvironment(graph, state, cameraScroll, viewportWidth, viewportHeight) {
  const viewLeft = cameraScroll.x;
  const viewRight = cameraScroll.x + viewportWidth;
  const viewTop = cameraScroll.y;
  const viewBottom = cameraScroll.y + viewportHeight;

  const floorW = pxToWorld(viewportWidth) * 1.15;
  const floorH = pxToWorld(viewportHeight) * 1.15;
  const floorCenter = viewToWorld(
    (viewLeft + viewRight) / 2,
    (viewTop + viewBottom) / 2,
    viewportWidth,
    viewportHeight,
  );
  graph.floor.scale.set(floorW, floorH, 1);
  graph.floor.position.set(floorCenter.x, -0.06, floorCenter.z);

  const gutterW = pxToWorld(state.playAreaLeft - viewLeft);
  const gutterRightW = pxToWorld(viewRight - state.playAreaRight);
  const corridorH = pxToWorld(viewportHeight);

  graph.leftGutter.scale.set(Math.max(0.01, gutterW), corridorH, 1);
  graph.leftGutter.position.set(
    floorCenter.x - floorW / 2 + gutterW / 2,
    -0.04,
    floorCenter.z,
  );

  graph.rightGutter.scale.set(Math.max(0.01, gutterRightW), corridorH, 1);
  graph.rightGutter.position.set(
    floorCenter.x + floorW / 2 - gutterRightW / 2,
    -0.04,
    floorCenter.z,
  );

  const protTop = state.wallY + CONFIG.WALL.halfHeight;
  const protViewH = viewBottom - protTop;
  if (protViewH > 0) {
    const protH = pxToWorld(protViewH);
    const protCenter = viewToWorld(
      (viewLeft + viewRight) / 2,
      protTop + protViewH / 2,
      viewportWidth,
      viewportHeight,
    );
    graph.protectedZone.visible = true;
    graph.protectedZone.scale.set(floorW, protH, 1);
    graph.protectedZone.position.set(protCenter.x, -0.03, protCenter.z);
  } else {
    graph.protectedZone.visible = false;
  }

  const wallCenter = viewToWorld(
    state.worldWidth / 2 - cameraScroll.x,
    state.wallY,
    viewportWidth,
    viewportHeight,
  );
  const wallW = pxToWorld(state.playAreaRight - state.playAreaLeft);
  const wallH = pxToWorld(CONFIG.WALL.halfHeight * 2);
  graph.wall.scale.set(wallW, wallH, pxToWorld(CONFIG.WALL.halfHeight));
  graph.wall.position.set(wallCenter.x, pxToWorld(CONFIG.WALL.halfHeight), wallCenter.z);
}

function entityViewPos(entity, cameraScroll) {
  return { x: entity.x - cameraScroll.x, y: entity.y - cameraScroll.y };
}

function placeSphere(mesh, viewX, viewY, radiusPx, viewportWidth, viewportHeight) {
  const pos = viewToWorld(viewX, viewY, viewportWidth, viewportHeight);
  const r = pxToWorld(radiusPx);
  mesh.position.set(pos.x, r, pos.z);
  mesh.scale.setScalar(r);
}

function syncBase(graph, state, cameraScroll, viewportWidth, viewportHeight, time) {
  const view = entityViewPos(state.base, cameraScroll);
  placeSphere(
    graph.baseMesh,
    view.x,
    view.y,
    CONFIG.BASE.radius,
    viewportWidth,
    viewportHeight,
  );

  const pulse =
    R3.pulseLightMin +
    (Math.sin(time * R3.pulseSpeed) * 0.5 + 0.5) *
      (R3.pulseLightMax - R3.pulseLightMin);
  graph.basePulseLight.intensity = pulse;
  graph.basePulseLight.position.copy(graph.baseMesh.position);
  graph.basePulseLight.position.y *= 0.45;
}

function syncPlayer(graph, state, cameraScroll, viewportWidth, viewportHeight) {
  const view = entityViewPos(state.player, cameraScroll);
  placeSphere(
    graph.playerMesh,
    view.x,
    view.y,
    CONFIG.PLAYER.radius,
    viewportWidth,
    viewportHeight,
  );
}

function syncEnemies(graph, state, cameraScroll, viewportWidth, viewportHeight) {
  const maxY = state.wallY - CONFIG.ENEMY.radius;
  graph.ensureEnemyPool(state.enemies.length);

  const visible = state.enemies.filter((e) => e.y <= maxY);

  if (graph.enemyInstanced) {
    let i = 0;
    for (const enemy of visible) {
      const view = entityViewPos(enemy, cameraScroll);
      const pos = viewToWorld(view.x, view.y, viewportWidth, viewportHeight);
      const r = pxToWorld(CONFIG.ENEMY.radius);
      graph.dummy.position.set(pos.x, r, pos.z);
      graph.dummy.scale.set(r, r, r);
      graph.dummy.updateMatrix();
      graph.enemyInstanced.setMatrixAt(i, graph.dummy.matrix);
      i += 1;
    }
    graph.enemyInstanced.count = i;
    graph.enemyInstanced.instanceMatrix.needsUpdate = true;
    return;
  }

  const live = new Set(visible.map((e) => e.id));
  for (const [id, mesh] of graph.enemyMeshes) {
    if (!live.has(id)) {
      graph.scene.remove(mesh);
      graph.enemyMeshes.delete(id);
    }
  }

  for (const enemy of visible) {
    let mesh = graph.enemyMeshes.get(enemy.id);
    if (!mesh) {
      mesh = new THREE.Mesh(graph.enemyGeo, graph.enemyMat);
      mesh.castShadow = true;
      graph.enemyMeshes.set(enemy.id, mesh);
      graph.scene.add(mesh);
    }
    const view = entityViewPos(enemy, cameraScroll);
    const pos = viewToWorld(view.x, view.y, viewportWidth, viewportHeight);
    const r = pxToWorld(CONFIG.ENEMY.radius);
    mesh.position.set(pos.x, r, pos.z);
    mesh.scale.set(r, r, r);
  }
}

function syncBullets(graph, state, cameraScroll, viewportWidth, viewportHeight) {
  const maxY = state.wallY;
  const visible = state.bullets.filter((b) => b.y <= maxY);
  const live = new Set(visible.map((b) => b.id));

  for (const [id, mesh] of graph.bulletMeshes) {
    if (!live.has(id)) {
      graph.scene.remove(mesh);
      graph.bulletMeshes.delete(id);
    }
  }

  for (const bullet of visible) {
    let mesh = graph.bulletMeshes.get(bullet.id);
    if (!mesh) {
      mesh = new THREE.Mesh(graph.bulletGeo, graph.bulletMat);
      mesh.castShadow = true;
      graph.bulletMeshes.set(bullet.id, mesh);
      graph.scene.add(mesh);
    }
    const view = entityViewPos(bullet, cameraScroll);
    const pos = viewToWorld(view.x, view.y, viewportWidth, viewportHeight);
    const r = pxToWorld(CONFIG.BULLET.radius);
    mesh.position.set(pos.x, r, pos.z);
    mesh.rotation.y = Math.atan2(bullet.vx, bullet.vy);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.set(r, r, r);
  }
}

function syncPickups(graph, state, cameraScroll, viewportWidth, viewportHeight) {
  const maxY = state.wallY;
  const visible = state.pickups.filter((p) => p.y <= maxY);
  const live = new Set(visible.map((p) => p.id));

  for (const [id, mesh] of graph.pickupMeshes) {
    if (!live.has(id)) {
      graph.scene.remove(mesh);
      graph.pickupMeshes.delete(id);
    }
  }

  for (const pickup of visible) {
    let mesh = graph.pickupMeshes.get(pickup.id);
    if (!mesh) {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), graph.pickupMat);
      mesh.castShadow = true;
      graph.pickupMeshes.set(pickup.id, mesh);
      graph.scene.add(mesh);
    }
    const view = entityViewPos(pickup, cameraScroll);
    placeSphere(
      mesh,
      view.x,
      view.y,
      CONFIG.PICKUP.radius,
      viewportWidth,
      viewportHeight,
    );
  }
}

export function renderWorldFrame(
  renderer,
  graph,
  gameState,
  cameraScroll,
  viewportWidth,
  viewportHeight,
) {
  layoutCamera(graph.camera, viewportWidth, viewportHeight, cameraScroll);
  syncEnvironment(graph, gameState, cameraScroll, viewportWidth, viewportHeight);
  syncBase(
    graph,
    gameState,
    cameraScroll,
    viewportWidth,
    viewportHeight,
    gameState.time ?? 0,
  );
  syncPlayer(graph, gameState, cameraScroll, viewportWidth, viewportHeight);
  syncEnemies(graph, gameState, cameraScroll, viewportWidth, viewportHeight);
  syncBullets(graph, gameState, cameraScroll, viewportWidth, viewportHeight);
  syncPickups(graph, gameState, cameraScroll, viewportWidth, viewportHeight);

  renderer.setSize(viewportWidth, viewportHeight, false);
  renderer.render(graph.scene, graph.camera);
}

/* ——— Screen-space 2D overlay (shop, buff icons, joystick) ——— */

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

  drawRoundedButton(ctx, layout.resumeButton, overlay.resumeLabel, {
    fill: overlay.resumeFill,
    stroke: 'rgba(21, 128, 61, 0.8)',
    text: overlay.resumeText,
    font: '700 15px system-ui, sans-serif',
    radius: 8,
  });
}

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

export function renderOverlayFrame(
  ctx,
  viewportWidth,
  viewportHeight,
  gameState,
  joystick,
) {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
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
