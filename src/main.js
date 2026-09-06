import * as THREE from 'three';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const container = document.getElementById('canvas-container');

// --- Realistic Renderer & Atmosphere Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060912); // Midnight London sky
scene.fog = new THREE.FogExp2(0x060912, 0.008); // Volumetric night fog

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
container.appendChild(renderer.domElement);

// --- High-Fidelity Realistic Lighting ---
const ambientLight = new THREE.AmbientLight(0x99aacc, 1.2);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x7799cc, 2.2);
moonLight.position.set(50, 100, -50);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.bias = -0.0001;
scene.add(moonLight);

const hemiLight = new THREE.HemisphereLight(0x5577aa, 0x221111, 0.9);
scene.add(hemiLight);

// --- Procedural Textures for Wet Asphalt & Puddles ---
function createWetAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#1a1c23';
  ctx.fillRect(0, 0, 512, 512);

  // Add asphalt grain noise
  for (let i = 0; i < 40000; i++) {
    const val = Math.random() * 30;
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 20);
  return texture;
}

const asphaltTexture = createWetAsphaltTexture();
const roadMat = new THREE.MeshStandardMaterial({
  map: asphaltTexture,
  roughness: 0.25, // Wet slick asphalt reflection
  metalness: 0.3
});

// --- INFINITE CHUNK MANAGEMENT SYSTEM ---
const CHUNK_SIZE = 150;
const TOTAL_CHUNKS = 8;
const roadWidth = 26;
const chunks = [];

function createEnvironmentChunk(chunkIndex) {
  const chunkGroup = new THREE.Group();
  const startZ = chunkIndex * CHUNK_SIZE;

  // Road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, CHUNK_SIZE), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, CHUNK_SIZE / 2);
  road.receiveShadow = true;
  chunkGroup.add(road);

  // Sidewalk Curbs
  [-roadWidth / 2 - 2, roadWidth / 2 + 2].forEach(x => {
    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.4, CHUNK_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.7 })
    );
    walk.position.set(x, 0.2, CHUNK_SIZE / 2);
    walk.receiveShadow = true;
    chunkGroup.add(walk);
  });

  // Road Yellow Center Stripes
  for (let z = 0; z < CHUNK_SIZE; z += 12) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 5),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, z);
    chunkGroup.add(stripe);
  }

  // Street Lamps & Warm Point Lights
  for (let z = 10; z < CHUNK_SIZE; z += 45) {
    [-roadWidth / 2 - 1, roadWidth / 2 + 1].forEach(x => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 9),
        new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8 })
      );
      pole.position.set(x, 4.5, z);
      chunkGroup.add(pole);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffea9f })
      );
      bulb.position.set(x > 0 ? x - 1 : x + 1, 8.8, z);
      chunkGroup.add(bulb);

      const light = new THREE.PointLight(0xffea9f, 2.5, 30, 1.8);
      light.position.set(x > 0 ? x - 1 : x + 1, 8.5, z);
      chunkGroup.add(light);
    });
  }

  // London Architecture & Buildings
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1c202d, roughness: 0.8 });
  for (let z = 15; z < CHUNK_SIZE; z += 35) {
    [-34, 34].forEach(x => {
      const h = 25 + Math.sin(z + chunkIndex) * 15 + 20;
      const building = new THREE.Mesh(new THREE.BoxGeometry(24, h, 30), buildingMat);
      building.position.set(x, h / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      chunkGroup.add(building);
    });
  }

  // Red Double-Decker Buses & Phone Booths
  if (chunkIndex % 2 === 0) {
    const bus = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 4.3, 9.5),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 })
    );
    bus.position.set(18, 2.15, CHUNK_SIZE / 2);
    bus.castShadow = true;
    chunkGroup.add(bus);

    const booth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xee0000, roughness: 0.3 })
    );
    booth.position.set(-15, 1.4, CHUNK_SIZE / 3);
    chunkGroup.add(booth);
  }

  chunkGroup.position.z = startZ;
  scene.add(chunkGroup);
  return { group: chunkGroup, index: chunkIndex };
}

// Initialize Starting Chunks
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
    new THREE.CylinderGeometry(4.2, 4.2, 0.2, 24),
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

  const metallicRedMat = new THREE.MeshStandardMaterial({ 
    color: 0xd61313, metalness: 0.9, roughness: 0.1 
  });
  const blackPillarMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.9 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 3.8), metallicRedMat);
  lowerBody.position.y = 0.55;
  lowerBody.castShadow = true;
  swiftGroup.add(lowerBody);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.2), metallicRedMat);
  hood.position.set(0, 0.75, 1.1);
  hood.rotation.x = -0.15;
  hood.castShadow = true;
  swiftGroup.add(hood);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.1), blackPillarMat);
  grille.position.set(0, 0.5, 1.91);
  swiftGroup.add(grille);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 2.0), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  swiftGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.1, 2.0), metallicRedMat);
  roof.position.set(0, 1.48, -0.2);
  roof.castShadow = true;
  swiftGroup.add(roof);

  // Headlights with High Intensity Beams
  [-0.75, 0.75].forEach(x => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xeeffff })
    );
    headlight.position.set(x, 0.7, 1.75);
    swiftGroup.add(headlight);

    const spot = new THREE.SpotLight(0xffffff, 14, 80, Math.PI / 4, 0.35);
    spot.position.set(x, 0.7, 1.8);
    spot.target.position.set(x, 0, 25);
    swiftGroup.add(spot, spot.target);
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
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });

  const wheels = [];
  [
    [-1.05, 0.42, 1.1], [1.05, 0.42, 1.1],
    [-1.05, 0.42, -1.1], [1.05, 0.42, -1.1]
  ].forEach(pos => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.33, 12), rimMat);
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

  // Acceleration & Handbrake
  if (controls.keys.forward) speed = Math.min(speed + 0.022, 1.25);
  else if (controls.keys.backward) speed = Math.max(speed - 0.022, -0.45);
  else speed *= 0.975;

  if (controls.keys.brake) speed *= 0.88;

  // Steering
  if (Math.abs(speed) > 0.01) {
    const dir = speed > 0 ? 1 : -1;
    if (controls.keys.left) carGroup.rotation.y += 0.045 * dir;
    if (controls.keys.right) carGroup.rotation.y -= 0.045 * dir;
  }

  carGroup.translateZ(speed);

  // Wheel Spin
  wheels.forEach(w => w.rotation.x += speed * 2.5);

  // Update Dynamic Sound Engine
  audio.update(speed, controls.keys.brake);

  // --- INFINITE ROAD RECYCLING LOGIC ---
  const carZ = carGroup.position.z;

  chunks.forEach(chunk => {
    // If a chunk is far behind the car, recycle it far ahead
    if (chunk.group.position.z < carZ - CHUNK_SIZE * 2) {
      let maxZ = -Infinity;
      chunks.forEach(c => { if (c.group.position.z > maxZ) maxZ = c.group.position.z; });
      chunk.group.position.z = maxZ + CHUNK_SIZE;
    }
  });

  // Keep Big Ben ahead in infinite view
  if (bigBen.position.z < carZ - 50) {
    bigBen.position.z = carZ + 400 + Math.random() * 200;
  }

  // Dynamic Camera Following
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
