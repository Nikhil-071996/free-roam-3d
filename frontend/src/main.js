import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';

// Connect through the Vite proxy. This works from both the desktop and a
// phone on the same Wi-Fi, instead of making the phone connect to itself.
const socket = io();

const scannerScreen = document.getElementById('scanner-screen');
const pairingTitle = document.getElementById('pairing-title');
const pairingStatus = document.getElementById('pairing-status');
const qrCodeCanvas = document.getElementById('qr-code');
const roomCode = document.getElementById('room-code');
const enterFullscreen = async () => {
  if (document.fullscreenElement) return true;

  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch (error) {
    console.warn('Fullscreen was not available:', error);
    return false;
  }
};

socket.on('connect', () => {
  console.log('Connected to server');
  console.log('Game Socket ID:', socket.id);
  // Ask server to create a room
  socket.emit('create-room');
});


socket.on('room-created', (data) => {
  console.log('==============================');
  console.log('ROOM CREATED');
  console.log('Room ID:', data.roomId);
  console.log('==============================');

  const controllerUrl =
    data.controllerUrl ||
    `${window.location.origin}/controller.html?room=${data.roomId}`;

  pairingTitle.textContent = 'Connect your controller';
  pairingStatus.textContent = 'Scan this code with your phone camera';
  roomCode.textContent = data.roomId;
  QRCode.toCanvas(qrCodeCanvas, controllerUrl, {
    width: 260,
    margin: 2,
    color: {
      dark: '#111111',
      light: '#ffffff',
    },
  });
});

socket.on('controller-connected', (data) => {
  console.log('🎮 Controller connected!');
  console.log(
    'Controller ID:',
    data.controllerId
  );

  scannerScreen.classList.add('hidden');
  // Request fullscreen without interrupting the game if the browser declines.
  enterFullscreen();
});

socket.on('controller-disconnected', () => {
  console.log('📱 Controller disconnected');

  // Prevent the player from continuing to move or look after a controller
  // disconnects while one of its buttons is held.
  Object.keys(input).forEach((key) => {
    input[key] = false;
  });

  pairingTitle.textContent = 'Controller disconnected';
  pairingStatus.textContent = 'Scan the QR code again to reconnect';
  scannerScreen.classList.remove('hidden');
});


socket.on('controller-input', (data) => {

  console.log(
    '🎮 Controller input received:',
    data
  );


  const value = data.pressed;

  if (data.type === 'joystick') {
    if (data.control === 'move') {
      input.moveX = data.x;
      input.moveY = data.y;
    }

    if (data.control === 'look') {
      input.lookX = data.x;
      input.lookY = data.y;
    }

    return;
  }

  if (data.type === 'look-delta') {
    input.lookDeltaX += data.deltaX;
    input.lookDeltaY += data.deltaY;
    return;
  }


  if (data.type === 'look') {
    switch (data.key) {
      case 'UP':
        input.lookUp = value;
        break;

      case 'DOWN':
        input.lookDown = value;
        break;

      case 'LEFT':
        input.lookLeft = value;
        break;

      case 'RIGHT':
        input.lookRight = value;
        break;
    }

    return;
  }


  if (data.type !== 'movement') {
    return;
  }


  switch (data.key) {

    case 'W':
      input.forward = value;
      break;

    case 'S':
      input.backward = value;
      break;

    case 'A':
      input.left = value;
      break;

    case 'D':
      input.right = value;
      break;

  }

});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server');
  console.log('Reason:', reason);
  
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});


// Test event from server
socket.on('test-response', (data) => {
  console.log('📨 Received from server:', data);
});



const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);


const ambientLight = new THREE.AmbientLight(
  0xffffff,
  0.6
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
  0xffffff,
  1.5
);

sun.position.set(10, 20, 10);

sun.castShadow = true;

scene.add(sun);


const groundGeometry = new THREE.PlaneGeometry(
  220,
  220
);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x3c9a3c,
});

const ground = new THREE.Mesh(
  groundGeometry,
  groundMaterial
);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

function createTree(x, z, scale = 1) {

  const tree = new THREE.Group();

  // -------------------------
  // Trunk
  // -------------------------

  const trunkGeometry = new THREE.CylinderGeometry(
    0.25,
    0.35,
    2,
    8
  );

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
  });

  const trunk = new THREE.Mesh(
    trunkGeometry,
    trunkMaterial
  );

  trunk.position.y = 1;

  trunk.castShadow = true;

  tree.add(trunk);


  // -------------------------
  // Leaves
  // -------------------------

  const leavesGeometry = new THREE.ConeGeometry(
    1.2,
    2.5,
    8
  );

  const leavesMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22,
  });

  const leaves = new THREE.Mesh(
    leavesGeometry,
    leavesMaterial
  );

  leaves.position.y = 2.8;

  leaves.castShadow = true;

  tree.add(leaves);


  // -------------------------
  // Position
  // -------------------------

  tree.position.set(x, 0, z);

  tree.scale.set(
    scale,
    scale,
    scale
  );

  scene.add(tree);
}


// =========================
// TREES
// =========================

// Left side
createTree(-5, -5, 1.2);
createTree(-7, -1, 0.9);
createTree(-5, 3, 1.4);
createTree(-8, 6, 1.1);

// Right side
createTree(5, -4, 1.1);
createTree(7, 0, 1.3);
createTree(5, 4, 0.9);
createTree(8, 7, 1.2);

// Behind
createTree(-2, -8, 1.3);
createTree(2, -9, 1);
createTree(7, -8, 1.4);


// =========================
// PROGRESSIVE WORLD MODELS
// =========================
// Large GLTF assets are loaded one at a time after the first frame renders.
// This keeps pairing and movement responsive instead of blocking startup.
const worldModels = [
  {
    name: 'Mountain forest',
    url: '/models/the_landscape_is_a_forest_in_the_mountains/scene.gltf',
    position: { x: 0, z: -42 },
    size: 45,
    rotationY: 0,
  },
  {
    name: 'Steel golem',
    url: '/models/dark_giant_robot_golem_steel_armor_pipes/scene.gltf',
    position: { x: 18, z: -8 },
    size: 7,
    rotationY: -Math.PI / 4,
  },
  {
    name: 'Roman baths',
    url: '/models/roman_baths/scene.gltf',
    position: { x: -34, z: 32 },
    size: 30,
    rotationY: -Math.PI / 3,
  },
  {
    name: 'Roman baths',
    url: '/models/roman_baths/scene.gltf',
    position: { x: -34, z: 32 },
    size: 30,
    rotationY: -Math.PI / 3,
  },
];


const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// First-person rotation order: turn around the vertical (Y) axis first,
// then look up/down. This prevents roll/"airplane" rotation.
camera.rotation.order = 'YXZ';

// Eye height
camera.position.set(
  0,
  1.7,
  10
);


const controls = new PointerLockControls(
  camera,
  document.body
);

document.addEventListener('click', () => {
  controls.lock();
});

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  lookUp: false,
  lookDown: false,
  lookLeft: false,
  lookRight: false,
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
};


document.addEventListener('keydown', (event) => {

  switch (event.code) {

    case 'KeyW':
      input.forward = true;
      break;

    case 'KeyS':
      input.backward = true;
      break;

    case 'KeyA':
      input.left = true;
      break;

    case 'KeyD':
      input.right = true;
      break;

  }
});

document.addEventListener('keyup', (event) => {

  switch (event.code) {

    case 'KeyW':
      input.forward = false;
      break;

    case 'KeyS':
      input.backward = false;
      break;

    case 'KeyA':
      input.left = false;
      break;

    case 'KeyD':
      input.right = false;
      break;

  }

});


const moveSpeed = 5;
const lookSpeed = 1.8;
const touchLookSensitivity = 0.004;
const maxLookAngle = Math.PI / 2 - 0.05;



const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('app').appendChild(renderer.domElement);

const modelLoader = new GLTFLoader();
const worldLoadingStatus = document.getElementById('world-loading-status');

function addWorldModel(gltf, config) {
  const model = gltf.scene;
  model.rotation.y = config.rotationY;
  model.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(model);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const largestDimension = Math.max(
    initialSize.x,
    initialSize.y,
    initialSize.z
  );

  // Source models use different authoring scales. Normalising them gives each
  // landmark a sensible size without modifying its original files.
  const scale = config.size / largestDimension;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.x = config.position.x - center.x;
  model.position.y = -bounds.min.y;
  model.position.z = config.position.z - center.z;

  model.traverse((object) => {
    if (!object.isMesh) return;

    // Imported scenes can contain thousands of meshes. Disabling expensive
    // dynamic shadow casting keeps frame time low while retaining lighting.
    object.castShadow = false;
    object.receiveShadow = true;
  });

  scene.add(model);
}

async function loadWorldModels() {
  for (let index = 0; index < worldModels.length; index += 1) {
    const config = worldModels[index];
    worldLoadingStatus.textContent =
      `Loading world: ${config.name} (${index + 1}/${worldModels.length})`;

    try {
      const gltf = await modelLoader.loadAsync(config.url);
      addWorldModel(gltf, config);
    } catch (error) {
      console.error(`Could not load ${config.name}:`, error);
    }

    // Yield briefly between models so rendering and controller input stay smooth.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  worldLoadingStatus.textContent = 'World ready';
  setTimeout(() => {
    worldLoadingStatus.hidden = true;
  }, 1800);
}

const startBackgroundLoading = () => {
  // Let the initial game frame and QR pairing screen render before downloading
  // any world asset. requestIdleCallback is not available in every browser.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadWorldModels, { timeout: 1200 });
  } else {
    setTimeout(loadWorldModels, 300);
  }
};

startBackgroundLoading();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  const speed = moveSpeed * delta;

  if (input.forward) {
    controls.moveForward(speed);
  }

  if (input.backward) {
    controls.moveForward(-speed);
  }

  if (input.left) {
    controls.moveRight(-speed);
  }

  if (input.right) {
    controls.moveRight(speed);
  }

  // Virtual left joystick: y is negative while the thumb is pushed up.
  if (input.moveY !== 0) {
    controls.moveForward(-input.moveY * speed);
  }

  if (input.moveX !== 0) {
    controls.moveRight(input.moveX * speed);
  }

  // Rotate the camera from the connected phone controller.
  // Local mouse look continues to work through PointerLockControls.
  if (input.lookLeft) {
    camera.rotation.y += lookSpeed * delta;
  }

  if (input.lookRight) {
    camera.rotation.y -= lookSpeed * delta;
  }

  if (input.lookUp) {
    camera.rotation.x += lookSpeed * delta;
  }

  if (input.lookDown) {
    camera.rotation.x -= lookSpeed * delta;
  }

  // Virtual right joystick. It turns like a first-person camera, never rolls.
  if (input.lookX !== 0) {
    camera.rotation.y -= input.lookX * lookSpeed * delta;
  }

  if (input.lookY !== 0) {
    camera.rotation.x -= input.lookY * lookSpeed * delta;
  }

  // PUBG-style free look: each drag movement turns the camera immediately.
  if (input.lookDeltaX !== 0 || input.lookDeltaY !== 0) {
    camera.rotation.y -= input.lookDeltaX * touchLookSensitivity;
    camera.rotation.x -= input.lookDeltaY * touchLookSensitivity;
    input.lookDeltaX = 0;
    input.lookDeltaY = 0;
  }

  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x,
    -maxLookAngle,
    maxLookAngle
  );

  // Keep player at eye height
  camera.position.y = 1.7;

  renderer.render(scene, camera);
}

animate();
