cat << 'EOF' > src/main.js
import * as THREE from 'three';
import { Controls } from './Controls.js';

const container = document.getElementById('canvas-container');

// --- Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c12); // Midnight sky color
scene.fog = new THREE.FogExp2(0x0a0c12, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// --- Atmospheric London Lighting ---
const ambientLight = new THREE.AmbientLight(0xdde5ff, 0.5);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x88aacc, 1.5);
moonLight.position.set(50, 80, -30);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 10;
moonLight.shadow.camera.far = 200;
moonLight.shadow.camera.left = -50;
moonLight.shadow.camera.right = 50;
moonLight.shadow.camera.top = 50;
moonLight.shadow.camera.bottom = -50;
scene.add(moonLight);

// --- Procedural London Asphalt & Road Layout ---
const roadWidth = 20;
const roadLength = 500;
const groundGeo = new THREE.PlaneGeometry(300, roadLength);
const groundMat = new THREE.MeshStandardMaterial({ 
  color: 0x181a20, 
  roughness: 0.4, 
  metalness: 0.1 
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Yellow center lane stripes
const stripeGeo = new THREE.PlaneGeometry(0.4, 4);
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const stripeGroup = new THREE.Group();
for (let z = -roadLength / 2; z < roadLength / 2; z += 10) {
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.02, z);
  stripeGroup.add(stripe);
}
scene.add(stripeGroup);

// --- Street Lamps & Buildings ---
const lampGeo = new THREE.CylinderGeometry(0.1, 0.15, 8);
const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
const bulbGeo = new THREE.SphereGeometry(0.4, 16, 16);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedaa });

const buildingMat = new THREE.MeshStandardMaterial({ color: 0x2a2830, roughness: 0.7 });

for (let z = -200; z <= 200; z += 30) {
  [-12, 12].forEach((x) => {
    // Street Lamp
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, 4, z);
    lamp.castShadow = true;
    
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x > 0 ? x - 1 : x + 1, 7.8, z);
    scene.add(lamp, bulb);

    const light = new THREE.PointLight(0xffedaa, 2, 25, 1.5);
    light.position.set(x > 0 ? x - 1 : x + 1, 7.5, z);
    scene.add(light);
  });

  [-35, 35].forEach((x) => {
    // London Architecture Blocks
    const height = 15 + Math.random() * 25;
    const bGeo = new THREE.BoxGeometry(20, height, 25);
    const building = new THREE.Mesh(bGeo, buildingMat);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
}

// --- High-Detail Sports Car Model ---
const carGroup = new THREE.Group();

// Main Chassis
const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd61c1c, metalness: 0.9, roughness: 0.1 });
const carBody = new THREE.Mesh(bodyGeo, bodyMat);
carBody.position.y = 0.7;
carBody.castShadow = true;
carGroup.add(carBody);

// Cabin Roof
const roofGeo = new THREE.BoxGeometry(1.6, 0.6, 2.2);
const roofMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.9, roughness: 0.1 });
const cabin = new THREE.Mesh(roofGeo, roofMat);
cabin.position.set(0, 1.3, -0.2);
cabin.castShadow = true;
carGroup.add(cabin);

// Wheels Setup
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
const wheels = [];

const wheelPositions = [
  [-1.15, 0.4, 1.3],  // Front Left
  [1.15, 0.4, 1.3],   // Front Right
  [-1.15, 0.4, -1.3], // Rear Left
  [1.15, 0.4, -1.3]   // Rear Right
];

wheelPositions.forEach((pos) => {
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(...pos);
  wheel.castShadow = true;
  wheels.push(wheel);
  carGroup.add(wheel);
});

// Headlights & Taillights
const headLightGeo = new THREE.BoxGeometry(0.4, 0.15, 0.1);
const headLightMat = new THREE.MeshBasicMaterial({ color: 0xeeddff });

[-0.7, 0.7].forEach((x) => {
  const headlight = new THREE.Mesh(headLightGeo, headLightMat);
  headlight.position.set(x, 0.75, 2.21);
  carGroup.add(headlight);

  const light = new THREE.SpotLight(0xffffff, 5, 40, Math.PI / 6, 0.5);
  light.position.set(x, 0.75, 2.2);
  light.target.position.set(x, 0, 10);
  carGroup.add(light);
  carGroup.add(light.target);
});

scene.add(carGroup);

// --- Physics & Controls Variables ---
const controls = new Controls();
let speed = 0;
let maxSpeed = 0.8;
let acceleration = 0.015;
let friction = 0.98;
let turnSpeed = 0.035;

// --- Main Game Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Acceleration & Braking Logic
  if (controls.keys.forward) {
    speed = Math.min(speed + acceleration, maxSpeed);
  } else if (controls.keys.backward) {
    speed = Math.max(speed - acceleration, -maxSpeed * 0.4);
  } else {
    speed *= friction;
  }

  // Handbrake behavior (Spacebar)
  if (controls.keys.brake) {
    speed *= 0.92;
  }

  // Steering & Wheel Rotation
  if (Math.abs(speed) > 0.001) {
    const dir = speed > 0 ? 1 : -1;
    if (controls.keys.left) carGroup.rotation.y += turnSpeed * dir;
    if (controls.keys.right) carGroup.rotation.y -= turnSpeed * dir;
  }

  // Drive movement
  carGroup.translateZ(speed);

  // Rotate wheels proportional to driving speed
  wheels.forEach(w => w.rotation.x += speed * 2);

  // Dynamic Third-Person Chase Camera
  const cameraOffset = new THREE.Vector3(0, 3.5, -9);
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y);
  
  const targetCamPos = carGroup.position.clone().add(cameraOffset);
  camera.position.lerp(targetCamPos, 0.12);
  camera.lookAt(carGroup.position.clone().add(new THREE.Vector3(0, 1, 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y)));

  renderer.render(scene, camera);
}

animate();

// Handle Window Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
EOF