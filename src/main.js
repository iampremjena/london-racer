import * as THREE from 'three';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const container = document.getElementById('canvas-container');

// --- Scene & Renderer Setup (Bright London Daytime) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec0ee); // Clear blue daytime sky
scene.fog = new THREE.FogExp2(0xaaccff, 0.003); // Soft horizon atmosphere fog

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer optimized for 120 FPS high refresh rate Mac displays
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  powerPreference: "high-performance",
  precision: "mediump"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

// --- High-Intensity Daytime Sunlight ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
sunLight.position.set(60, 120, 40);
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x556644, 0.9);
scene.add(hemiLight);

// --- Materials ---
const roadMat = new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.6 });
const walkMat = new THREE.MeshStandardMaterial({ color: 0x9999a5, roughness: 0.8 });
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

// Building Facade Palette
const buildingColors = [0x7a6b5d, 0x8c7b6c, 0x5c5d63, 0x9e8e78];
const buildingMats = buildingColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));

// --- INFINITE CHUNK ENVIRONMENT SYSTEM ---
const CHUNK_SIZE = 160;
const TOTAL_CHUNKS = 6;
const roadWidth = 26;
const chunks = [];

function createEnvironmentChunk(chunkIndex) {
  const chunkGroup = new THREE.Group();
  const startZ = chunkIndex * CHUNK_SIZE;

  // Road Surface
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, CHUNK_SIZE), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, CHUNK_SIZE / 2);
  chunkGroup.add(road);

  // Sidewalk Curbs
  [-roadWidth / 2 - 2, roadWidth / 2 + 2].forEach(x => {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, CHUNK_SIZE), walkMat);
    walk.position.set(x, 0.2, CHUNK_SIZE / 2);
    chunkGroup.add(walk);
  });

  // Road Lane Markings
  const stripeGeo = new THREE.PlaneGeometry(0.5, 5);
  for (let z = 0; z < CHUNK_SIZE; z += 12) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, z);
    chunkGroup.add(stripe);
  }

  // Street Trees & Lamp Posts
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1d2120, metalness: 0.7 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.8 });

  for (let z = 10; z < CHUNK_SIZE; z += 40) {
    [-roadWidth / 2 - 1, roadWidth / 2 + 1].forEach((x, idx) => {
      // Lamp Posts
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 4, z);
      chunkGroup.add(pole);

      // Trees along sidewalks
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3), trunkMat);
      trunk.position.set(x > 0 ? x + 4 : x - 4, 1.5, z + 15);
      
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2), foliageMat);
      foliage.position.set(x > 0 ? x + 4 : x - 4, 4.2, z + 15);
      
      chunkGroup.add(trunk, foliage);
    });
  }

  // Detailed London Architecture Blocks
  for (let z = 15; z < CHUNK_SIZE; z += 38) {
    [-34, 34].forEach((x, i) => {
      const h = 25 + Math.sin(z + chunkIndex) * 12 + 20;
      const bMat = buildingMats[(chunkIndex + i + Math.floor(z / 30)) % buildingMats.length];
      const building = new THREE.Mesh(new THREE.BoxGeometry(24, h, 30), bMat);
      building.position.set(x, h / 2, z);
      chunkGroup.add(building);
    });
  }

  // Red Double-Decker Buses & Phone Booths
  if (chunkIndex % 2 === 0) {
    // London Bus
    const busMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });
    const bus = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.3, 9.5), busMat);
    bus.position.set(18, 2.15, CHUNK_SIZE / 2);
    chunkGroup.add(bus);

    // Red Phone Booth
    const boothMat = new THREE.MeshStandardMaterial({ color: 0xdd0000, roughness: 0.3 });
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 1.4), boothMat);
    booth.position.set(-15, 1.4, CHUNK_SIZE / 3);
    chunkGroup.add(booth);
  }

  chunkGroup.position.z = startZ;
  scene.add(chunkGroup);
  return { group: chunkGroup, index: chunkIndex };
}

// Generate Initial Chunks
for (let i = -2; i < TOTAL_CHUNKS - 2; i++) {
  chunks.push(createEnvironmentChunk(i));
}

// Landmark: Big Ben Tower
function createBigBen() {
  const benGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd1c1a5, roughness: 0.6 });
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

// --- INDIAN MARUTI SUZUKI SWIFT MODEL ---
function createSwiftCar() {
  const swiftGroup = new THREE.Group();

  const metallicRedMat = new THREE.MeshStandardMaterial({ color: 0xd61313, metalness: 0.85, roughness: 0.15 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111a2e, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.85 });

  // Main Chassis & Hood
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 3.8), metallicRedMat);
  lowerBody.position.y = 0.55;
  swiftGroup.add(lowerBody);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.2), metallicRedMat);
  hood.position.set(0, 0.75, 1.1);
  hood.rotation.x = -0.15;
  swiftGroup.add(hood);

  // Front Hex Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.1), blackMat);
  grille.position.set(0, 0.5, 1.91);
  swiftGroup.add(grille);

  // Swift Floating Roof Design
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 2.0), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  swiftGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.1, 2.0), metallicRedMat);
  roof.position.set(0, 1.48, -0.2);
  swiftGroup.add(roof);

  // Curved Headlights
  [-0.75, 0.75].forEach(x => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    headlight.position.set(x, 0.7, 1.75);
    swiftGroup.add(headlight);
  });

  // Red Tail Lights
  [-0.75, 0.75].forEach(x => {
    const tailLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xee0000 })
    );
    tailLight.position.set(x, 0.8, -1.91);
    swiftGroup.add(tailLight);
  });

  // Alloy Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.85 });

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

  // Smooth Acceleration & Braking
  if (controls.keys.forward) speed = Math.min(speed + 0.022, 1.25);
  else if (controls.keys.backward) speed = Math.max(speed - 0.022, -0.45);
  else speed *= 0.98;

  if (controls.keys.brake) speed *= 0.88;

  // Steering
  if (Math.abs(speed) > 0.01) {
    const dir = speed > 0 ? 1 : -1;
    if (controls.keys.left) carGroup.rotation.y += 0.045 * dir;
    if (controls.keys.right) carGroup.rotation.y -= 0.045 * dir;
  }

  carGroup.translateZ(speed);

  // Rotate wheels
  wheels.forEach(w => w.rotation.x += speed * 2.5);

  audio.update(speed, controls.keys.brake);

  // Infinite Chunk Recycling
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

  // Camera Tracking
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
