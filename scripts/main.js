import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 16;

// === Orbit Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.rotateSpeed = 0.25;

let isUserInteracting = false;
controls.addEventListener('start', () => isUserInteracting = true);
controls.addEventListener('end', () => isUserInteracting = false);

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 1));

// === Audio Setup ===
let clickSound, hoverSound;
let audioInitialized = false;

function createAudioElements() {
  clickSound = new Audio('./sounds/click.m4a');
  hoverSound = new Audio('./sounds/tick.m4a');
  clickSound.volume = 0.5;
  hoverSound.volume = 0.3;
}

window.addEventListener('pointerdown', () => {
  if (!audioInitialized) {
    createAudioElements();
    clickSound.volume = 0;
    hoverSound.volume = 0;
    clickSound.play().then(() => clickSound.pause()).catch(() => { });
    hoverSound.play().then(() => hoverSound.pause()).catch(() => { });
    setTimeout(() => {
      clickSound.volume = 0.5;
      hoverSound.volume = 0.3;
    }, 100);
    audioInitialized = true;
  }
});

// === Tooltip ===
const popup = document.getElementById('popup');

// === Raycasting Setup ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED = null;

// === Coin Setup ===
const coinPaths = [
  './models/1_PENNY.glb',
  './models/1_POUND.glb',
  './models/2_PENCE.glb',
  './models/2_POUNDS.glb',
  './models/50_PENCE.glb',
];

const coinInfo = [
  '1 Penny',
  '1 Pound',
  '2 Pence',
  '2 Pounds',
  '50 Pence'
];

const coinGroup = new THREE.Group();
const coinMeshes = [];
scene.add(coinGroup);

const radius = 8;
const clock = new THREE.Clock();

// === Load Coins ===
coinPaths.forEach((path, i) => {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const coin = gltf.scene;

    const box = new THREE.Box3().setFromObject(coin);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scaleFactor = 5 / Math.max(size.x, size.y, size.z);
    coin.scale.setScalar(scaleFactor);

    const center = new THREE.Vector3();
    box.getCenter(center);
    coin.position.sub(center);

    const angle = (i / coinPaths.length) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    coin.position.set(x, 0, z);
    coin.lookAt(0, 0, 0);

    coin.userData.label = coinInfo[i];
    coin.userData.spinX = (Math.random() * 0.01) + 0.0025;
    coin.userData.spinY = (Math.random() * 0.01) + 0.0025;
    coin.userData.bobOffset = Math.random() * Math.PI * 2;
    coin.userData.bobAmplitude = 0.2 + Math.random() * 0.1;
    coin.userData.flyOut = false;

    coinGroup.add(coin);
    coinMeshes.push(coin);

    const lastViewed = localStorage.getItem('lastViewedCoin');
    if (lastViewed && lastViewed === coin.userData.label.replace(' ', '_').toUpperCase()) {
      const focusAngle = (i / coinPaths.length) * Math.PI * 2;
      coinGroup.rotation.y = -focusAngle;
      localStorage.removeItem('lastViewedCoin');
    }
  });
});

// === Resize Handling ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Mouse Tracking ===
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// === Coin Click with Fly-Up Animation ===
window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(coinMeshes, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target.parent && !coinMeshes.includes(target)) {
      target = target.parent;
    }

    if (coinMeshes.includes(target)) {
      const coinLabel = target.userData.label.replace(' ', '_').toUpperCase();

      if (clickSound && audioInitialized) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => { });
      }

      // Disable bounce
      target.userData.flyOut = true;

      // Animate fly-up
      const startY = target.position.y;
      const endY = startY + 10;
      const startRotation = target.rotation.y;
      const totalFrames = 15;
      let frame = 0;

      function animateUp() {
        const t = frame / totalFrames;
        target.position.y = startY + (endY - startY) * t;

        // Rotate 180° (π radians) → now 216° (~π * 1.2)
        target.rotation.y = startRotation + Math.PI * 1.2 * t;

        frame++;

        if (frame <= totalFrames) {
          requestAnimationFrame(animateUp);
        } else {
          localStorage.setItem('lastViewedCoin', coinLabel);
          localStorage.setItem('lastViewedGLB', `${location.origin}/coinproject/models/${coinLabel}.glb`);
          window.location.href = `coins/${coinLabel}.html`;
        }
      }

      animateUp();
    }
  }
});

// === Menu Navigation ===
document.querySelectorAll('#menu li').forEach((item) => {
  item.addEventListener('click', () => {
    const coinPage = item.getAttribute('data-coin');
    localStorage.setItem('lastViewedCoin', coinPage.toUpperCase());
    localStorage.setItem('lastViewedGLB', `${location.origin}/coinproject/models/${coinPage}.glb`);
    window.location.href = `coins/${coinPage}.html`;
  });
});

// === Touch Carousel ===
let startX = 0;
window.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const deltaX = e.touches[0].clientX - startX;
  coinGroup.rotation.y += deltaX * 0.005;
  startX = e.touches[0].clientX;
  isUserInteracting = true;
}, { passive: true });

window.addEventListener('touchend', () => {
  isUserInteracting = false;
});

// === Animate Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const elapsed = clock.getElapsedTime();

  if (!isUserInteracting) {
    coinGroup.rotation.y += 0.0025;
  }

  coinMeshes.forEach((coin) => {
    coin.rotation.y += coin.userData.spinY;
    coin.rotation.x += coin.userData.spinX;

    // Only bounce if not flying out
    if (!coin.userData.flyOut) {
      const bob = Math.sin(elapsed * 2 + coin.userData.bobOffset) * coin.userData.bobAmplitude;
      coin.position.y = bob;
    }
  });

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(coinMeshes, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target.parent && !coinMeshes.includes(target)) {
      target = target.parent;
    }

    if (INTERSECTED !== target) {
      INTERSECTED = target;
      if (hoverSound && audioInitialized) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(() => { });
      }
      document.body.style.cursor = 'pointer';
    }

    const worldPosition = new THREE.Vector3();
    INTERSECTED.getWorldPosition(worldPosition);
    const screenPos = worldPosition.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.innerText = INTERSECTED.userData.label || 'Coin';
    popup.classList.add('visible');
  } else {
    if (INTERSECTED) {
      INTERSECTED = null;
      document.body.style.cursor = 'default';
      popup.classList.remove('visible');
    }
  }

  renderer.render(scene, camera);
}

animate();
