import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

const menuOverlay = document.getElementById("menu-overlay");
const startBtn = document.getElementById("start-btn");
const hud = document.getElementById("hud");
const speedometer = document.getElementById("speedometer");

let gameStarted = false;

// --- Photorealistic PBR Scene & Lighting Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x76a3d7); // Realistic daylight atmospheric tone
scene.fog = new THREE.FogExp2(0x76a3d7, 0.0012);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", precision: "highp" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic color grading
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("canvas-container").appendChild(renderer.domElement);

// --- Real-world Sunlight & Reflection Map ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
sunLight.position.set(100, 150, 70);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0001;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x334422, 0.8);
scene.add(hemiLight);

// --- REALISTIC ASPHALT ROAD & ENVIRONMENT ---
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2500, 2500),
  new THREE.MeshStandardMaterial({ color: 0x3d6647, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

// Track Curve Spline
const trackPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(120, 0, 280),
  new THREE.Vector3(340, 0, 380),
  new THREE.Vector3(550, 0, 140),
  new THREE.Vector3(450, 0, -240),
  new THREE.Vector3(180, 0, -420),
  new THREE.Vector3(-250, 0, -320),
  new THREE.Vector3(-180, 0, -120)
];

const curve = new THREE.CatmullRomCurve3(trackPoints, true);
const trackWidth = 26;

// High-detail PBR Wet Asphalt Road Ribbon
const trackGeometry = new THREE.TubeGeometry(curve, 350, trackWidth / 2, 10, true);
const trackMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x1f2128, 
  roughness: 0.35, // Realistic asphalt reflection
  metalness: 0.15 
});
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.scale.y = 0.015;
trackMesh.position.y = 0.08;
trackMesh.receiveShadow = true;
scene.add(trackMesh);

// Center Road Markings
const stripeGroup = new THREE.Group();
const stripeGeo = new THREE.PlaneGeometry(0.6, 5);
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

for (let i = 0; i < 350; i++) {
  const t = i / 350;
  const pt = curve.getPoint(t);
  const tangent = curve.getTangent(t);
  
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.copy(pt);
  stripe.position.y = 0.16;
  stripe.lookAt(pt.clone().add(tangent));
  stripeGroup.add(stripe);
}
scene.add(stripeGroup);

// --- REALISTIC BUILDINGS & ENVIRONMENT ---
const buildingMats = [
  new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.6 }),
  new THREE.MeshStandardMaterial({ color: 0x565860, roughness: 0.6 }),
  new THREE.MeshStandardMaterial({ color: 0x9c8a74, roughness: 0.5 })
];

for (let i = 0; i < 100; i++) {
  const t = i / 100;
  const pt = curve.getPoint(t);
  const tangent = curve.getTangent(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  [-38, 38].forEach((side, idx) => {
    const bPos = pt.clone().add(normal.clone().multiplyScalar(side));
    const h = 28 + Math.random() * 32;
    const building = new THREE.Mesh(new THREE.BoxGeometry(26, h, 28), buildingMats[(i + idx) % buildingMats.length]);
    building.position.set(bPos.x, h / 2, bPos.z);
    building.lookAt(pt);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
}

// --- GLTF MODEL LOADER & CAR OBJECTS ---
const loader = new GLTFLoader();
const playerCarGroup = new THREE.Group();
scene.add(playerCarGroup);

// Detailed PBR Body Shader (Fallback & Base Body)
function createDetailedRacerBody(bodyColor) {
  const carGroup = new THREE.Group();
  const metallicMat = new THREE.MeshStandardMaterial({ 
    color: bodyColor, 
    metalness: 0.9, 
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x050a14, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.9 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.0), metallicMat);
  body.position.y = 0.55;
  body.castShadow = true;
  carGroup.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 1.3), metallicMat);
  hood.position.set(0, 0.75, 1.2);
  hood.rotation.x = -0.12;
  hood.castShadow = true;
  carGroup.add(hood);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), blackMat);
  grille.position.set(0, 0.5, 2.01);
  carGroup.add(grille);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2.1), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  carGroup.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.1, 2.1), metallicMat);
  roof.position.set(0, 1.48, -0.2);
  roof.castShadow = true;
  carGroup.add(roof);

  // Alloy Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.35, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.1 });

  const wheels = [];
  [[-1.1, 0.44, 1.2], [1.1, 0.44, 1.2], [-1.1, 0.44, -1.2], [1.1, 0.44, -1.2]].forEach(pos => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    wheelGroup.position.set(...pos);
    carGroup.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  return { carMesh: carGroup, wheels };
}

// Instantiate Player Racer
const { carMesh: fallbackPlayerMesh, wheels } = createDetailedRacerBody(0xd61313);
playerCarGroup.add(fallbackPlayerMesh);

// --- AI OPPONENT RACERS ---
const aiCars = [];
[0x0055ff, 0xffbb00].forEach((color, idx) => {
  const { carMesh: aiGroup } = createDetailedRacerBody(color);
  scene.add(aiGroup);
  aiCars.push({ group: aiGroup, progress: 0.05 + idx * 0.04, speed: 0.0007 + idx * 0.0001 });
});

// --- CONTROLS, AUDIO & DRIFT PHYSICS ---
const controls = new Controls();
const audio = new AudioController();
let speed = 0;
let carProgress = 0;

startBtn.addEventListener("click", () => {
  menuOverlay.style.display = "none";
  hud.style.display = "block";
  gameStarted = true;
});

// --- MAIN 120 FPS GAME LOOP ---
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
    playerCarGroup.position.y = 0.08;

    // Track Boundary Collision Clamping
    const closestPointParam = curve.getUtoTmapping(carProgress);
    const trackCenter = curve.getPoint(closestPointParam);
    const distFromTrackCenter = playerCarGroup.position.distanceTo(trackCenter);

    if (distFromTrackCenter > trackWidth / 2 - 1.2) {
      const pushDirection = trackCenter.clone().sub(playerCarGroup.position).normalize();
      playerCarGroup.position.add(pushDirection.multiplyScalar(0.4));
      speed *= 0.85;
    }

    carProgress = (carProgress + speed * 0.0005) % 1;
    if (carProgress < 0) carProgress += 1;

    wheels.forEach(w => w.rotation.x += speed * 2.5);
    audio.update(speed);

    // AI Racers driving along spline
    aiCars.forEach(ai => {
      ai.progress = (ai.progress + ai.speed) % 1;
      const pt = curve.getPoint(ai.progress);
      const tangent = curve.getTangent(ai.progress);
      ai.group.position.copy(pt);
      ai.group.position.y = 0.08;
      ai.group.lookAt(pt.clone().add(tangent));
    });

    speedometer.innerText = `${Math.round(Math.abs(speed) * 120)} KM/H`;

    // Dynamic Camera Tracking
    const camOffset = new THREE.Vector3(0, 3.8, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y);
    camera.position.copy(playerCarGroup.position).add(camOffset);
    camera.lookAt(playerCarGroup.position.clone().add(new THREE.Vector3(0, 1, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y)));
  } else {
    // Orbit camera for menu background
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
