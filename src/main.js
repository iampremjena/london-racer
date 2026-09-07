import * as THREE from "three";
import { Controls } from "./Controls.js";
import { AudioController } from "./AudioController.js";

const menuOverlay = document.getElementById("menu-overlay");
const startBtn = document.getElementById("start-btn");
const hud = document.getElementById("hud");
const speedometer = document.getElementById("speedometer");

let gameStarted = false;

// --- Scene & Performance Optimized Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec0ee);
scene.fog = new THREE.FogExp2(0xaaccff, 0.002);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", precision: "mediump" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.getElementById("canvas-container").appendChild(renderer.domElement);

// --- High-Fidelity Daytime Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
sunLight.position.set(60, 120, 40);
scene.add(sunLight);

// --- CURVED STREET RACE TRACK ---
const trackPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(80, 0, 200),
  new THREE.Vector3(250, 0, 300),
  new THREE.Vector3(400, 0, 100),
  new THREE.Vector3(350, 0, -200),
  new THREE.Vector3(120, 0, -350),
  new THREE.Vector3(-180, 0, -250),
  new THREE.Vector3(-120, 0, -80)
];

const curve = new THREE.CatmullRomCurve3(trackPoints, true);
const trackGeometry = new THREE.TubeGeometry(curve, 250, 14, 12, true);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.5 });
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.scale.y = 0.01;
scene.add(trackMesh);

// --- SURROUNDINGS (Buildings, Trees, Big Ben) ---
const buildingMats = [0x7a6b5d, 0x8c7b6c, 0x5c5d63, 0x9e8e78].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));

for (let i = 0; i < 70; i++) {
  const t = i / 70;
  const pt = curve.getPoint(t);
  const sideOffset = (i % 2 === 0 ? 38 : -38);
  const h = 20 + Math.random() * 25;
  const bMat = buildingMats[i % buildingMats.length];
  const building = new THREE.Mesh(new THREE.BoxGeometry(22, h, 28), bMat);
  building.position.set(pt.x + sideOffset, h / 2, pt.z);
  scene.add(building);
}

// Landmark: Big Ben
const benGroup = new THREE.Group();
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd1c1a5, roughness: 0.6 });
const towerBase = new THREE.Mesh(new THREE.BoxGeometry(12, 65, 12), stoneMat);
towerBase.position.y = 32.5;
benGroup.add(towerBase);
const spire = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 4), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }));
spire.position.y = 76;
benGroup.add(spire);
benGroup.position.set(-60, 0, 100);
scene.add(benGroup);

// --- HIGH-QUALITY MARUTI SUZUKI SWIFT CAR ---
function createSwiftCar(bodyColor) {
  const swiftGroup = new THREE.Group();
  const metallicMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.85, roughness: 0.15 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111a2e, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.85 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 3.8), metallicMat);
  lowerBody.position.y = 0.55;
  swiftGroup.add(lowerBody);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.2), metallicMat);
  hood.position.set(0, 0.75, 1.1);
  hood.rotation.x = -0.15;
  swiftGroup.add(hood);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.1), blackMat);
  grille.position.set(0, 0.5, 1.91);
  swiftGroup.add(grille);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 2.0), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  swiftGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.1, 2.0), metallicMat);
  roof.position.set(0, 1.48, -0.2);
  swiftGroup.add(roof);

  [-0.75, 0.75].forEach(x => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    headlight.position.set(x, 0.7, 1.75);
    swiftGroup.add(headlight);
  });

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.85 });

  const wheels = [];
  [[-1.05, 0.42, 1.1], [1.05, 0.42, 1.1], [-1.05, 0.42, -1.1], [1.05, 0.42, -1.1]].forEach(pos => {
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

const { carMesh: playerCarGroup, wheels } = createSwiftCar(0xd61313);
scene.add(playerCarGroup);

// --- AI OPPONENT RACERS ---
const aiCars = [];
[0x0066cc, 0xffcc00].forEach((color, idx) => {
  const { carMesh: aiGroup } = createSwiftCar(color);
  scene.add(aiGroup);
  aiCars.push({ group: aiGroup, progress: 0.05 + idx * 0.04, speed: 0.0007 + idx * 0.0001 });
});

// --- CONTROLS & AUDIO ---
const controls = new Controls();
const audio = new AudioController();
let speed = 0;

startBtn.addEventListener("click", () => {
  menuOverlay.style.display = "none";
  hud.style.display = "block";
  gameStarted = true;
});

// --- GAME LOOP (120 FPS HIGH PERFORMANCE) ---
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
    wheels.forEach(w => w.rotation.x += speed * 2.5);
    audio.update(speed);

    // AI Racers driving along spline curve
    aiCars.forEach(ai => {
      ai.progress = (ai.progress + ai.speed) % 1;
      const pt = curve.getPoint(ai.progress);
      const tangent = curve.getTangent(ai.progress);
      ai.group.position.copy(pt);
      ai.group.lookAt(pt.clone().add(tangent));
    });

    speedometer.innerText = `${Math.round(Math.abs(speed) * 120)} KM/H`;

    // Dynamic Camera Tracking
    const camOffset = new THREE.Vector3(0, 3.8, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y);
    camera.position.copy(playerCarGroup.position).add(camOffset);
    camera.lookAt(playerCarGroup.position.clone().add(new THREE.Vector3(0, 1, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y)));
  } else {
    // Menu Camera Orbit
    const time = Date.now() * 0.0005;
    camera.position.set(Math.cos(time) * 40, 20, Math.sin(time) * 40);
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