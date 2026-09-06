import * as THREE from 'three';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const container = document.getElementById('canvas-container');

// --- Scene & Performance Optimized Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e18);
scene.fog = new THREE.FogExp2(0x0a0e18, 0.006);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);

// Optimize Renderer for Mac 120Hz Displays
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  powerPreference: "high-performance",
  precision: "mediump" // Higher performance GPU shader precision
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap DPR at 2 for Mac Retina screens
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// --- High-Performance Optimized Lighting (No Heavy Shadows) ---
const ambientLight = new THREE.AmbientLight(0xdde5ff, 1.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0x88bbff, 2.0);
mainLight.position.set(40, 80, -40);
scene.add(mainLight);

const hemiLight = new THREE.HemisphereLight(0x5577aa, 0x221111, 0.8);
scene.add(hemiLight);

// --- Lightweight Wet Road Material ---
const roadMat = new THREE.MeshStandardMaterial({ 
  color: 0x1a1c23, 
  roughness: 0.25, 
  metalness: 0.2 
});

// --- INFINITE CHUNK SYSTEM (60-120 FPS Optimized) ---
const CHUNK_SIZE = 160;
const TOTAL_CHUNKS = 6;
const roadWidth = 26;
const chunks = [];

function createEnvironmentChunk(chunkIndex) {
  const chunkGroup = new THREE.Group();
  const startZ = chunkIndex * CHUNK_SIZE;

  // Road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, CHUNK_SIZE), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, CHUNK_SIZE / 2);
  chunkGroup.add(road);

  // Sidewalks
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 });
  [-roadWidth / 2 - 2, roadWidth / 2 + 2].forEach(x => {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, CHUNK_SIZE), walkMat);
    walk.position.set(x, 0.2, CHUNK_SIZE / 2);
    chunkGroup.add(walk);
  });

  // Road Stripes
  const stripeGeo = new THREE.PlaneGeometry(0.5, 5);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  for (let z = 0; z < CHUNK_SIZE; z += 14) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, z);
    chunkGroup.add(stripe);
  }

  // Street Lamps
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8 });
  const bulbGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });

  for (let z = 10; z < CHUNK_SIZE; z += 50) {
    [-roadWidth / 2 - 1, roadWidth / 2 + 1].forEach(x => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 4, z);
      chunkGroup.add(pole);

      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x > 0 ? x - 1 : x + 1, 7.8, z);
      chunkGroup.add(bulb);
    });
  }

  // London Buildings
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1c202d, roughness: 0.8 });
  for (let z = 15; z < CHUNK_SIZE; z += 40) {
    [-34, 34].forEach(x => {
      const h = 25 + Math.sin(z + chunkIndex) * 12 + 20;
      const building = new THREE.Mesh(new THREE.BoxGeometry(24, h, 32), buildingMat);
      building.position.set(x, h / 2, z);
      chunkGroup.add(building);
    });
  }

  // Red Bus & Phone Booth
  if (chunkIndex % 2 === 0) {
    const bus = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 4.2, 9.5),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 })
    );
    bus.position.set(18, 2.1, CHUNK_SIZE / 2);
    chunkGroup.add(bus);

    const booth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xee0000, roughness: 0.4 })
    );
    booth.position.set(-15, 1.4, CHUNK_SIZE / 3);
    chunkGroup.add(booth);
  }

  chunkGroup.position.z = startZ;
  scene.add(chunkGroup);
  return { group: chunkGroup, index: chunkIndex };
}

// Initialize Chunks
for (let i = -2; i < TOTAL_CHUNKS - 2; i++) {
  chunks.push(createEnvironmentChunk(i));
}

// Big Ben Landmark
function createBigBen() {
  const benGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb5a489, roughness: 0.7 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });

  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(10, 65, 10), stoneMat);
  towerBase.position.y = 32.5;
  benGroup.add(towerBase);

  const clockSection = new THREE.Mesh(new THREE.BoxGeometry(11.5, 13, 11.5), stoneMat);
  clockSection.position.y = 70;
  benGroup.add(clockSection);

  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xfffbe6 })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 70, 5.8);
  benGroup.add(clockFace);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(6.5, 22, 4), goldMat);
  spire.position.y = 87.5;
  benGroup.add(spire);

  return benGroup;
}
const bigBen = createBigBen();
bigBen.position.set(-38, 0, 180);
scene.add(bigBen);

// --- MARUTI SUZUKI SWIFT CAR MODEL ---
function createSwiftCar() {
  const swiftGroup = new THREE.Group();

  const metallicRedMat = new THREE.MeshStandardMaterial({ color: 0xd61313, metalness: 0.8, roughness: 0.2 });
  const blackPillarMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.9, roughness: 0.1 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 3.8), metallicRedMat);
  lowerBody.position.y = 0.55;
  swiftGroup.add(lowerBody);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.2), metallicRedMat);
  hood.position.set(0, 0.75, 1.1);
  hood.rotation.x = -0.15;
  swiftGroup.add(hood);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.1), blackPillarMat);
  grille.position.set(0, 0.5, 1.91);
  swiftGroup.add(grille);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 2.0), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  swiftGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.1, 2.0), metallicRedMat);
  roof.position.set(0, 1.48, -0.2);
  swiftGroup.add(roof);

  // Headlights
  [-0.75, 0.75].forEach(x => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xeeffff })
    );
    headlight.position.set(x, 0.7, 1.75);
    swiftGroup.add(headlight);
  });

  // Tail Lights
  [-0.75, 0.75].forEach(x => {
    const tailLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tailLight.position.set(x, 0.8, -1.91);
    swiftGroup.add(tailLight);
  });

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });

  const wheels = [];
  [
    [-1.05, 0.42, 1.1], [1.05, 0.42, 1.1],
    [-1.05, 0.42, -1.1], [1.05, 0.42, -1.1]
  ].forEach(pos => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.33, 8), rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    wheelGroup.position.set(...pos);
    swiftGroup.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  return { carMesh: swiftGroup, wheels };
}

const { carMesh: carGroup, wheels } = createSwiftCar();
scene.add(carGroup);

// --- Controls & Audio Engine ---
const controls = new Controls();
const audio = new AudioController();
let speed = 0;

// --- Main Engine Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Driving Physics
  if (controls.keys.forward) speed = Math.min(speed + 0.022, 1.25);
  else if (controls.keys.backward) speed = Math.max(speed - 0.022, -0.45);
  else speed *= 0.98;

  if (controls.keys.brake) speed *= 0.88;

  if (Math.abs(speed) > 0.01) {
    const dir = speed > 0 ? 1 : -1;
    if (controls.keys.left) carGroup.rotation.y += 0.045 * dir;
    if (controls.keys.right) carGroup.rotation.y -= 0.045 * dir;
  }

  carGroup.translateZ(speed);

  wheels.forEach(w => w.rotation.x += speed * 2.5);

  audio.update(speed, controls.keys.brake);

  // Infinite Road Recycling
  const carZ = carGroup.position.z;
  chunks.forEach(chunk => {
    if (chunk.group.position.z < carZ - CHUNK_SIZE * 2) {
      let maxZ = -Infinity;
      chunks.forEach(c => { if (c.group.position.z > maxZ) maxZ = c.group.position.z; });
      chunk.group.position.z = maxZ + CHUNK_SIZE;
    }
  });

  if (bigBen.position.z < carZ - 50) {
    bigBen.position.z = carZ + 400 + Math.random() * 200;
  }

  // Camera Follow
  const camOffset = new THREE.Vector3(0, 3.8, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y);
  camera.position.copy(carGroup.position).add(camOffset);
  camera.lookAt(carGroup.position.clone().add(new THREE.Vector3(0, 1, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y)));

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
