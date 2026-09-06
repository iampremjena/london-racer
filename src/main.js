cat << 'EOF' > src/main.js
import * as THREE from 'three';
import { Controls } from './Controls.js';

const container = document.getElementById('canvas-container');

// Scene & Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a24);
scene.fog = new THREE.FogExp2(0x1a1a24, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
scene.add(dirLight);

// London Street Ground Plane
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Simple Car Placeholder
const carGroup = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.6, roughness: 0.2 });
const carBody = new THREE.Mesh(bodyGeo, bodyMat);
carBody.position.y = 0.8;
carBody.castShadow = true;
carGroup.add(carBody);

scene.add(carGroup);

// Camera Offset
camera.position.set(0, 3, -8);
camera.lookAt(carGroup.position);

const controls = new Controls();
let speed = 0;

// Game Loop
function animate() {
  requestAnimationFrame(animate);

  if (controls.keys.forward) speed = Math.min(speed + 0.01, 0.5);
  else if (controls.keys.backward) speed = Math.max(speed - 0.01, -0.2);
  else speed *= 0.98;

  if (controls.keys.left) carGroup.rotation.y += 0.03;
  if (controls.keys.right) carGroup.rotation.y -= 0.03;

  carGroup.translateZ(speed);

  // Smooth camera tracking
  const targetCamPos = carGroup.position.clone().add(
    new THREE.Vector3(0, 3, -8).applyAxisAngle(new THREE.Vector3(0, 1, 0), carGroup.rotation.y)
  );
  camera.position.lerp(targetCamPos, 0.1);
  camera.lookAt(carGroup.position);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
EOF