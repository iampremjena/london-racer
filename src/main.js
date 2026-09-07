import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Controls } from './Controls.js';
import { AudioController } from './AudioController.js';

// --- UI Elements ---
const menuOverlay = document.getElementById('menu-overlay');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const speedometer = document.getElementById('speedometer');

let gameStarted = false;

// --- Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec0ee);
scene.fog = new THREE.FogExp2(0x7ec0ee, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- Daylight Street Race Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
sunLight.position.set(100, 150, 50);
scene.add(sunLight);

// --- CURVED STREET RACE TRACK (CatmullRom Spline) ---
const trackPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(50, 0, 150),
  new THREE.Vector3(200, 0, 250),
  new THREE.Vector3(350, 0, 100),
  new THREE.Vector3(300, 0, -150),
  new THREE.Vector3(100, 0, -300),
  new THREE.Vector3(-150, 0, -200),
  new THREE.Vector3(-100, 0, -50),
];

const curve = new THREE.CatmullRomCurve3(trackPoints, true);
const trackGeometry = new THREE.TubeGeometry(curve, 200, 14, 12, true);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.5 });
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.scale.y = 0.01;
scene.add(trackMesh);

// --- BUILDINGS ALONG CURVES ---
const buildingMat = new THREE.MeshStandardMaterial({ color: 0x7a6b5d, roughness: 0.7 });
for (let i = 0; i < 60; i++) {
  const t = i / 60;
  const pt = curve.getPoint(t);
  const sideOffset = (i % 2 === 0 ? 35 : -35);
  
  const h = 20 + Math.random() * 25;
  const building = new THREE.Mesh(new THREE.BoxGeometry(20, h, 20), buildingMat);
  building.position.set(pt.x + sideOffset, h / 2, pt.z);
  scene.add(building);
}

// --- PLAYER CAR & GLTF LOADING ---
let playerCarGroup = new THREE.Group();
scene.add(playerCarGroup);

// Fallback high-spec procedural car
const fallbackBody = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.7, 4.0),
  new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.85, roughness: 0.15 })
);
fallbackBody.position.y = 0.6;
playerCarGroup.add(fallbackBody);

// Safe GLTF Loader with local relative pathing
const loader = new GLTFLoader();
loader.load(
  './assets/models/car.glb',
  (gltf) => {
    playerCarGroup.remove(fallbackBody);
    const model = gltf.scene;
    model.scale.set(0.9, 0.9, 0.9);
    model.position.y = 0.1;
    playerCarGroup.add(model);
    console.log("3D Car model loaded successfully!");
  },
  undefined,
  (err) => {
    console.warn('GLTF load fallback active:', err);
  }
);

// --- AI OPPONENT RACERS ---
const aiCars = [];
const aiColors = [0x0066cc, 0xffcc00];

aiColors.forEach((color, idx) => {
  const aiGroup = new THREE.Group();
  const aiMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.7, 4.0),
    new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2 })
  );
  aiMesh.position.y = 0.6;
  aiGroup.add(aiMesh);
  
  scene.add(aiGroup);
  aiCars.push({ group: aiGroup, progress: 0.05 + idx * 0.03, speed: 0.0008 + idx * 0.0001 });
});

// --- CONTROLS & AUDIO ---
const controls = new Controls();
const audio = new AudioController();
let speed = 0;

// --- START GAME CLICK EVENT ---
startBtn.addEventListener('click', () => {
  menuOverlay.style.display = 'none';
  hud.style.display = 'block';
  gameStarted = true;
});

// --- MAIN ENGINE LOOP ---
function animate() {
  requestAnimationFrame(animate);

  if (gameStarted) {
    if (controls.keys.forward) speed = Math.min(speed + 0.02, 1.4);
    else if (controls.keys.backward) speed = Math.max(speed - 0.02, -0.4);
    else speed *= 0.98;

    if (controls.keys.brake) speed *= 0.88;

    if (Math.abs(speed) > 0.01) {
      const dir = speed > 0 ? 1 : -1;
      if (controls.keys.left) playerCarGroup.rotation.y += 0.04 * dir;
      if (controls.keys.right) playerCarGroup.rotation.y -= 0.04 * dir;
    }

    playerCarGroup.translateZ(speed);
    audio.update(speed, controls.keys.brake);

    // AI Racers along track
    aiCars.forEach(ai => {
      ai.progress = (ai.progress + ai.speed) % 1;
      const pt = curve.getPoint(ai.progress);
      const tangent = curve.getTangent(ai.progress);
      
      ai.group.position.copy(pt);
      ai.group.lookAt(pt.clone().add(tangent));
    });

    speedometer.innerText = `${Math.round(Math.abs(speed) * 120)} KM/H`;

    // Camera follow
    const camOffset = new THREE.Vector3(0, 4, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y);
    camera.position.copy(playerCarGroup.position).add(camOffset);
    camera.lookAt(playerCarGroup.position.clone().add(new THREE.Vector3(0, 1, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerCarGroup.rotation.y)));
  } else {
    // Menu background camera rotation
    const time = Date.now() * 0.0005;
    camera.position.set(Math.cos(time) * 30, 15, Math.sin(time) * 30);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
