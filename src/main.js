import * as THREE from 'three';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const menuOverlay = document.getElementById("menu-overlay");
const startBtn = document.getElementById("start-btn");
const hud = document.getElementById("hud");
const speedometer = document.getElementById("speedometer");

let gameStarted = false;

// --- Scene & Renderer (High Performance 120 FPS Settings) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x70b2e6); // Crisp daylight sky
scene.fog = new THREE.FogExp2(0x70b2e6, 0.0015);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", precision: "mediump" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.getElementById("canvas-container").appendChild(renderer.domElement);

// --- High-Fidelity Daylight Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff8ea, 2.8);
sunLight.position.set(80, 140, 60);
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x445533, 0.8);
scene.add(hemiLight);

// --- GROUND & CURVED RACING TRACK (Z-Fighting Prevention) ---
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.9 }) // Grass fields surrounding London track
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// Circuit Spline Definition
const trackPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(100, 0, 250),
  new THREE.Vector3(300, 0, 350),
  new THREE.Vector3(500, 0, 120),
  new THREE.Vector3(420, 0, -220),
  new THREE.Vector3(150, 0, -400),
  new THREE.Vector3(-220, 0, -300),
  new THREE.Vector3(-150, 0, -100)
];

const curve = new THREE.CatmullRomCurve3(trackPoints, true);
const trackWidth = 24;

// Build Elevated Road Ribbon to eliminate missing road glitches
const trackGeometry = new THREE.TubeGeometry(curve, 300, trackWidth / 2, 8, true);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2d35, roughness: 0.45, metalness: 0.1 });
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.scale.y = 0.02; // Flatten tube into distinct thick asphalt road ribbon
trackMesh.position.y = 0.05;
scene.add(trackMesh);

// Center Road Yellow Stripes
const stripeGroup = new THREE.Group();
const stripeGeo = new THREE.PlaneGeometry(0.6, 5);
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

for (let i = 0; i < 300; i++) {
  const t = i / 300;
  const pt = curve.getPoint(t);
  const tangent = curve.getTangent(t);
  
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.copy(pt);
  stripe.position.y = 0.12; // Layer above road to prevent clipping
  stripe.lookAt(pt.clone().add(tangent));
  stripeGroup.add(stripe);
}
scene.add(stripeGroup);

// --- LONDON ENVIRONMENT & BUILDINGS ---
const buildingMats = [
  new THREE.MeshStandardMaterial({ color: 0x8c7865, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0x6e7078, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xab9882, roughness: 0.6 })
];

for (let i = 0; i < 90; i++) {
  const t = i / 90;
  const pt = curve.getPoint(t);
  const tangent = curve.getTangent(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  [-36, 36].forEach((side, idx) => {
    const bPos = pt.clone().add(normal.clone().multiplyScalar(side));
    const h = 25 + Math.random() * 30;
    const building = new THREE.Mesh(new THREE.BoxGeometry(24, h, 26), buildingMats[(i + idx) % buildingMats.length]);
    building.position.set(bPos.x, h / 2, bPos.z);
    building.lookAt(pt);
    scene.add(building);
  });
}

// Big Ben Landmark
function createBigBen() {
  const benGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xdfb738, metalness: 0.8, roughness: 0.2 });

  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(14, 70, 14), stoneMat);
  towerBase.position.y = 35;
  benGroup.add(towerBase);

  const clockSection = new THREE.Mesh(new THREE.BoxGeometry(15, 14, 15), stoneMat);
  clockSection.position.y = 77;
  benGroup.add(clockSection);

  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xfffbe6 })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 77, 7.6);
  benGroup.add(clockFace);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(8, 25, 4), goldMat);
  spire.position.y = 96.5;
  benGroup.add(spire);

  return benGroup;
}
const bigBen = createBigBen();
bigBen.position.set(-80, 0, 120);
scene.add(bigBen);

// --- MARUTI SUZUKI SWIFT CAR MODEL (Refined Geometry) ---
function createSwiftCar(bodyColor) {
  const swiftGroup = new THREE.Group();

  const metallicMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.85, roughness: 0.15 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.85 });

  // Main Chasis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 3.9), metallicMat);
  body.position.y = 0.55;
  swiftGroup.add(body);

  // Sloping Swift Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 1.3), metallicMat);
  hood.position.set(0, 0.75, 1.15);
  hood.rotation.x = -0.12;
  swiftGroup.add(hood);

  // Front Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), blackMat);
  grille.position.set(0, 0.5, 1.96);
  swiftGroup.add(grille);

  // Floating Roof Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2.1), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  swiftGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.1, 2.1), metallicMat);
  roof.position.set(0, 1.48, -0.2);
  swiftGroup.add(roof);

  // Side Mirrors
  [-1.1, 1.1].forEach(x => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.25), metallicMat);
    mirror.position.set(x, 1.05, 0.6);
    swiftGroup.add(mirror);
  });

  // Headlights & Tail Lights
  [-0.8, 0.8].forEach(x => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    headlight.position.set(x, 0.7, 1.85);
    swiftGroup.add(headlight);

    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xee0000 }));
    tailLight.position.set(x, 0.75, -1.96);
    swiftGroup.add(tailLight);
  });

  // Alloy Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });

  const wheels = [];
  [[-1.1, 0.42, 1.15], [1.1, 0.42, 1.15], [-1.1, 0.42, -1.15], [1.1, 0.42, -1.15]].forEach(pos => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.36, 10), rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    wheelGroup.position.set(...pos);
    swiftGroup.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  return { carMesh: swiftGroup, wheels };
}

const { carMesh: playerCarGroup, wheels } = createSwiftCar(0xd61313);
scene.add(playerCarGroup);

// --- AI OPPONENTS ---
const aiCars = [];
[0x0066cc, 0xffcc00].forEach((color, idx) => {
  const { carMesh: aiGroup } = createSwiftCar(color);
  scene.add(aiGroup);
  aiCars.push({ group: aiGroup, progress: 0.05 + idx * 0.04, speed: 0.0007 + idx * 0.0001 });
});

// --- CONTROLS, AUDIO & TRACK COLLISION ---
const controls = new Controls();
const audio = new AudioController();
let speed = 0;
let carProgress = 0;

startBtn.addEventListener("click", () => {
  menuOverlay.style.display = "none";
  hud.style.display = "block";
  gameStarted = true;
});

// --- GAME LOOP ---
function animate() {
  requestAnimationFrame(animate);

  if (gameStarted) {
    if (controls.keys.forward) speed = Math.min(speed + 0.022, 1.35);
    else if (controls.keys.backward) speed = Math.max(speed - 0.022, -0.45);
    else speed *= 0.98;

    if (controls.keys.brake) speed *= 0.88;

    if (Math.abs(speed) > 0.01) {
      const dir = speed > 0 ? 1 : -1;
      if (controls.keys.left) playerCarGroup.rotation.y += 0.045 * dir;
      if (controls.keys.right) playerCarGroup.rotation.y -= 0.045 * dir;
    }

    playerCarGroup.translateZ(speed);

    // Keep car grounded at road height
    playerCarGroup.position.y = 0.05;

    // TRACK BOUNDARY COLLISION CLAMPING (Prevents going off-road beyond buildings)
    const closestPointParam = curve.getUtoTmapping(carProgress);
    const trackCenter = curve.getPoint(closestPointParam);
    const distFromTrackCenter = playerCarGroup.position.distanceTo(trackCenter);

    // Hard boundary constraint along street width
    if (distFromTrackCenter > trackWidth / 2 - 1.2) {
      const pushDirection = trackCenter.clone().sub(playerCarGroup.position).normalize();
      playerCarGroup.position.add(pushDirection.multiplyScalar(0.4));
      speed *= 0.85; // Slow down on curb impact
    }

    // Update car progress parameter
    carProgress = (carProgress + speed * 0.0005) % 1;
    if (carProgress < 0) carProgress += 1;

    wheels.forEach(w => w.rotation.x += speed * 2.5);
    audio.update(speed);

    // AI Racers driving along curve
    aiCars.forEach(ai => {
      ai.progress = (ai.progress + ai.speed) % 1;
      const pt = curve.getPoint(ai.progress);
      const tangent = curve.getTangent(ai.progress);
      ai.group.position.copy(pt);
      ai.group.position.y = 0.05;
      ai.group.lookAt(pt.clone().add(tangent));
    });

    speedometer.innerText = `${Math.round(Math.abs(speed) * 120)} KM/H`;

    // Dynamic Camera Tracking
    const camOffset = new THREE.Vector3(0, 3.8, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y);
    camera.position.copy(playerCarGroup.position).add(camOffset);
    camera.lookAt(playerCarGroup.position.clone().add(new THREE.Vector3(0, 1, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y)));
  } else {
    // Menu Orbit Camera
    const time = Date.now() * 0.0005;
    camera.position.set(Math.cos(time) * 45, 22, Math.sin(time) * 45);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
