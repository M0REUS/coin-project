import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// === Get model path from localStorage ===
const glbPath = localStorage.getItem('lastViewedGLB');

if (!glbPath) {
  alert('Coin model path is missing. Please return to the home page.');
  window.location.href = '../index.html';
  throw new Error('No GLB path found in localStorage');
}

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('three-canvas'),
  alpha: true,
  antialias: true
});

// === Lock canvas height on initial load (prevents resize issue on mobile) ===
const fixedHeight = window.innerHeight;
renderer.setSize(window.innerWidth, fixedHeight);
renderer.domElement.style.height = `${fixedHeight}px`;

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1));

// === Load Coin Model ===
const loader = new GLTFLoader();
let coin = null;
const clock = new THREE.Clock();

loader.load(
  glbPath,
  (gltf) => {
    coin = gltf.scene;

    // === Get bounding box and size
    const box = new THREE.Box3().setFromObject(coin);
    const size = new THREE.Vector3();
    box.getSize(size);
    const coinMaxDim = Math.max(size.x, size.y, size.z);

    // === Compute visible width in world units at camera depth
    const halfFovRadians = THREE.MathUtils.degToRad(camera.fov / 2);
    const visibleHeight = 2 * Math.tan(halfFovRadians) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const screenMarginPx = 32;
    const marginWorldUnits = (screenMarginPx / window.innerWidth) * visibleWidth;
    const maxCoinWidthWorld = visibleWidth - marginWorldUnits;

    const scaleFactor = Math.min(2.5 / coinMaxDim, maxCoinWidthWorld / coinMaxDim);
    coin.scale.setScalar(scaleFactor);

    // === Center geometry
    const center = new THREE.Vector3();
    box.getCenter(center);
    coin.position.sub(center);

    // === Start below view for animation
    coin.position.y = -5;
    scene.add(coin);

    // === Slide in from bottom animation
    const targetY = 1.0;
    function animateCoinIn() {
      coin.position.y += (targetY - coin.position.y) * 0.1;
      if (Math.abs(coin.position.y - targetY) > 0.01) {
        requestAnimationFrame(animateCoinIn);
      } else {
        coin.position.y = targetY;
      }
    }

    animateCoinIn();
  },
  undefined,
  (err) => {
    console.error('Failed to load model:', err);
    alert('Failed to load coin model.');
  }
);

// === Responsive Resize with Debouncing (fix mobile scroll resize issue) ===
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const fixedHeight = window.innerHeight;
    camera.aspect = window.innerWidth / fixedHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, fixedHeight);
    renderer.domElement.style.height = `${fixedHeight}px`;
  }, 250);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  if (coin) {
    const delta = clock.getDelta();
    coin.rotation.z += 0.01 * delta * 60; // Frame-rate independent
  }
  renderer.render(scene, camera);
}

animate();
