import * as THREE from 'three';
import { Controls } from './Controls.js';

const container = document.getElementById('canvas-container');

// --- Scene & Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111625); // London evening sky blue
scene.fog = new THREE.FogExp2(0x111625, 0.008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// --- High-Visibility Bright Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.8); // High global brightness
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
sunLight.position.set(30, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Hemisphere light for vibrant ground/sky contrast
const hemiLight = new THREE.HemisphereLight(0x709ada, 0x332211, 1.2);
scene.add(hemiLight);

// --- Road & Sidewalks ---
const roadWidth = 24;
const roadLength = 600;

// Asphalt Ground
const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.6 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

// Sidewalks
[-roadWidth / 2 - 2, roadWidth / 2 + 2].forEach(x => {
  const walkGeo = new THREE.BoxGeometry(4, 0.4, roadLength);
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.8 });
  const walk = new THREE.Mesh(walkGeo, walkMat);
  walk.position.set(x, 0.2, 0);
  walk.receiveShadow = true;
  scene.add(walk);
});

// Center Road Stripes
const stripeGeo = new THREE.PlaneGeometry(0.5, 5);
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
for (let z = -roadLength / 2; z < roadLength / 2; z += 12) {
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.02, z);
  scene.add(stripe);
}

// --- Detailed Sports Car Group ---
const carGroup = new THREE.Group();

// Main Car Body Shell
const carBodyGeo = new THREE.BoxGeometry(2.2, 0.7, 4.6);
const carBodyMat = new THREE.MeshStandardMaterial({ color: 0xe60000, metalness: 0.8, roughness: 0.2 });
const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
carBody.position.y = 0.6;
carBody.castShadow = true;
carGroup.add(carBody);

// Sleek Roof / Windshield
const cabinGeo = new THREE.BoxGeometry(1.7, 0.55, 2.4);
const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f111a, metalness: 0.9, roughness: 0.1 });
const cabin = new THREE.Mesh(cabinGeo, cabinMat);
cabin.position.set(0, 1.2, -0.2);
cabin.castShadow = true;
carGroup.add(cabin);

// Spoiler
const spoilerWing = new THREE.Mesh(
  new THREE.BoxGeometry(2.2, 0.1, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
);
spoilerWing.position.set(0, 1.3, -2.1);
carGroup.add(spoilerWing);

// Glowing Headlights
[-0.85, 0.85].forEach(x => {
  const lightMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.15, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ffff }) // Bright cyan glow
  );
  lightMesh.position.set(x, 0.65, 2.31);
  carGroup.add(lightMesh);

  const spot = new THREE.SpotLight(0xffffff, 8, 50, Math.PI / 5, 0.4);
  spot.position.set(x, 0.65, 2.3);
  spot.target.position.set(x, 0, 15);
  carGroup.add(spot);
  carGroup.add(spot.target);
});

// Wheels
const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 24);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 });

[
  [-1.2, 0.45, 1.4],
  [1.2, 0.45, 1.4],
  [-1.2, 0.45, -1.4],
  [1.2, 0.45, -1.4]
].forEach(pos => {
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(...pos);
  wheel.castShadow = true;
  carGroup.add(wheel);
});

scene.add(carGroup);

// --- London Environment (Red Double-Decker Buses & Buildings) ---
const busGeo = new THREE.BoxGeometry(3.2, 4.2, 9);
const busMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const buildingMat = new THREE.MeshStandardMaterial({ color: 0x3d3b45, roughness: 0.7 });

for (let z = -250; z <= 250; z += 40) {
  // Red London Bus decor on sides
  if (Math.abs(z) % 80 === 0) {
    const bus = new THREE.Mesh(busGeo, busMat);
    bus.position.set(16, 2.1, z);
    bus.castShadow = true;
    scene.add(bus);
  }

  // City Buildings
  [-30, 30].forEach(x => {
    const h = 20 + Math.random() * 30;
    const b = new THREE.Mesh(new THREE.BoxGeometry(22, h, 30), buildingMat);
    b.position.set(x, h / 2, z);
    b.castShadow = true;
    scene.add(b);
  });
}

// --- Controls & Camera Setup ---
const controls = new Controls();
let speed = 0;

function animate() {
  requestAnimationFrame(animate);

  // Controls Logic
  if (controls.keys.forward) speed = Math.min(speed + 0.02, 0.9);
  else if (controls.keys.backward) speed = Math.max(speed - 0.02, -0.3);
  else speed *= 0.97;

  if (controls.keys.brake) speed *= 0.90;

  if (Math.abs(speed) > 0.01) {
    const dir = speed > 0 ? 1 : -1;
    if (controls.keys.left) carGroup.rotation.y += 0.04 * dir;
    if (controls.keys.right) carGroup.rotation.y -= 0.04 * dir;
  }

  carGroup.translateZ(speed);

  // High-Angle Chase Camera
  const camOffset = new THREE.Vector3(0, 4.5, -11).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y);
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
