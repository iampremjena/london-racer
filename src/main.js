import * as THREE from 'three';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const container = document.getElementById('canvas-container');

// --- Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e18); // London night sky
scene.fog = new THREE.FogExp2(0x0a0e18, 0.007);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// --- High-Quality Atmospheric Lighting ---
const ambientLight = new THREE.AmbientLight(0xdde5ff, 1.2);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x88bbff, 2.0);
moonLight.position.set(40, 80, -40);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
scene.add(moonLight);

// Warm street atmosphere light
const hemiLight = new THREE.HemisphereLight(0x446699, 0x221100, 0.8);
scene.add(hemiLight);

// --- Wet Asphalt Road & Sidewalks ---
const roadWidth = 26;
const roadLength = 800;

const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ 
  color: 0x1a1c23, 
  roughness: 0.3, // Wet reflection look
  metalness: 0.2 
});
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

// Sidewalk Curbs
[-roadWidth / 2 - 2, roadWidth / 2 + 2].forEach(x => {
  const walk = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.4, roadLength),
    new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.8 })
  );
  walk.position.set(x, 0.2, 0);
  walk.receiveShadow = true;
  scene.add(walk);
});

// Center Road Stripes
for (let z = -roadLength / 2; z < roadLength / 2; z += 12) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 5),
    new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.02, z);
  scene.add(stripe);
}

// --- BUILD MARUTI SUZUKI SWIFT HATCHBACK ---
function createSwiftCar() {
  const swiftGroup = new THREE.Group();

  const metallicRedMat = new THREE.MeshStandardMaterial({ 
    color: 0xd61313, 
    metalness: 0.85, 
    roughness: 0.15 
  });
  const blackPillarMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.85 });

  // Lower Main Body Chassis
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.6, 3.8),
    metallicRedMat
  );
  lowerBody.position.y = 0.55;
  lowerBody.castShadow = true;
  swiftGroup.add(lowerBody);

  // Sloping Hood
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.35, 1.2),
    metallicRedMat
  );
  hood.position.set(0, 0.75, 1.1);
  hood.rotation.x = -0.15;
  hood.castShadow = true;
  swiftGroup.add(hood);

  // Front Grille (Signature Swift Hexagonal Front)
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.3, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  grille.position.set(0, 0.5, 1.91);
  swiftGroup.add(grille);

  // Swift Floating Roof Cabin & Black Pillars
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.6, 2.0),
    glassMat
  );
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  swiftGroup.add(cabin);

  // Roof Top
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 0.1, 2.0),
    metallicRedMat
  );
  roof.position.set(0, 1.48, -0.2);
  roof.castShadow = true;
  swiftGroup.add(roof);

  // Curved Headlights (Swift Swept-Back LED Style)
  [-0.75, 0.75].forEach(x => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xeeffff })
    );
    headlight.position.set(x, 0.7, 1.75);
    headlight.rotation.y = x > 0 ? -0.2 : 0.2;
    swiftGroup.add(headlight);

    // Light Beam Spotlights
    const spot = new THREE.SpotLight(0xffffff, 10, 60, Math.PI / 5, 0.4);
    spot.position.set(x, 0.7, 1.8);
    spot.target.position.set(x, 0, 20);
    swiftGroup.add(spot, spot.target);
  });

  // Red Tail Lights
  [-0.75, 0.75].forEach(x => {
    const tailLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tailLight.position.set(x, 0.8, -1.91);
    swiftGroup.add(tailLight);
  });

  // Side Mirrors
  [-1.1, 1.1].forEach(x => {
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.25),
      metallicRedMat
    );
    mirror.position.set(x, 1.05, 0.6);
    swiftGroup.add(mirror);
  });

  // Alloy Wheels (4x)
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

  const wheels = [];
  [
    [-1.05, 0.4, 1.1],  // FL
    [1.05, 0.4, 1.1],   // FR
    [-1.05, 0.4, -1.1], // RL
    [1.05, 0.4, -1.1]   // RR
  ].forEach(pos => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Alloy Rim Cap
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.31, 12), rimMat);
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

// --- LONDON SURROUNDINGS & LANDMARKS ---
// Big Ben Clock Tower Model
function createBigBen() {
  const benGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb5a489, roughness: 0.7 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });

  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(10, 60, 10), stoneMat);
  towerBase.position.y = 30;
  benGroup.add(towerBase);

  const clockSection = new THREE.Mesh(new THREE.BoxGeometry(11, 12, 11), stoneMat);
  clockSection.position.y = 66;
  benGroup.add(clockSection);

  // Clock Face
  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 0.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xfffbe6 })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 66, 5.6);
  benGroup.add(clockFace);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(6, 20, 4), goldMat);
  spire.position.y = 82;
  benGroup.add(spire);

  return benGroup;
}

const bigBen = createBigBen();
bigBen.position.set(-35, 0, 50);
scene.add(bigBen);

// Red London Phone Booths & Double Decker Buses
const busGeo = new THREE.BoxGeometry(3.5, 4.2, 9.5);
const busMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });
const boothGeo = new THREE.BoxGeometry(1.4, 2.8, 1.4);
const boothMat = new THREE.MeshStandardMaterial({ color: 0xee0000, roughness: 0.3 });

for (let z = -350; z <= 350; z += 50) {
  // Red Buses
  if (Math.abs(z) % 100 === 0) {
    const bus = new THREE.Mesh(busGeo, busMat);
    bus.position.set(18, 2.1, z);
    bus.castShadow = true;
    scene.add(bus);
  }

  // Phone Booths
  const booth = new THREE.Mesh(boothGeo, boothMat);
  booth.position.set(-15, 1.4, z + 10);
  scene.add(booth);

  // City Buildings with Illuminated Windows
  [-32, 32].forEach(x => {
    const h = 25 + Math.sin(z) * 15 + 20;
    const bGeo = new THREE.BoxGeometry(22, h, 35);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x1f2330, roughness: 0.8 });
    const building = new THREE.Mesh(bGeo, bMat);
    building.position.set(x, h / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
}

// --- Controls & Audio setup ---
const controls = new Controls();
const audio = new AudioController();

let speed = 0;

// --- Main Engine Game Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Acceleration / Braking
  if (controls.keys.forward) speed = Math.min(speed + 0.02, 1.1);
  else if (controls.keys.backward) speed = Math.max(speed - 0.02, -0.4);
  else speed *= 0.97;

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

  // Update Dynamic Sound Engine
  audio.update(speed, controls.keys.brake);

  // Dynamic Smooth Third-Person Camera
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
