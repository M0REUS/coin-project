import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === GitHub Pages base path ===
const basePath = `${window.location.origin}/coin-project`;

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 16;

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.rotateSpeed = 0.25;

let isUserInteracting = false;
controls.addEventListener('start', () => isUserInteracting = true);
controls.addEventListener('end', () => isUserInteracting = false);

// === Light ===
scene.add(new THREE.AmbientLight(0xffffff, 1));

// === Audio ===
let clickSound, hoverSound;
let audioInitialized = false;

function createAudioElements() {
  clickSound = new Audio(`${basePath}/sounds/click.m4a`);
  hoverSound = new Audio(`${basePath}/sounds/tick.m4a`);
  clickSound.volume = 0.5;
  hoverSound.volume = 0.3;
}

window.addEventListener('pointerdown', () => {
  if (!audioInitialized) {
    createAudioElements();
    clickSound.volume = 0;
    hoverSound.volume = 0;
    clickSound.play().then(() => clickSound.pause()).catch(() => {});
    hoverSound.play().then(() => hoverSound.pause()).catch(() => {});
    setTimeout(() => {
      clickSound.volume = 0.5;
      hoverSound.volume = 0.3;
    }, 100);
    audioInitialized = true;
  }
});

// === Tooltip ===
const popup = document.getElementById('popup');

// === Raycaster ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED = null;

// === Coin Setup ===
const coinPaths = [
  `${basePath}/models/1_PENNY.glb`,
  `${basePath}/models/1_POUND.glb`,
  `${basePath}/models/2_PENCE.glb`,
  `${basePath}/models/2_POUNDS.glb`,
  `${basePath}/models/50_PENCE.glb`,
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
        clickSound.play().catch(() => {});
      }

      target.userData.flyOut = true;

      const startY = target.position.y;
      const endY = startY + 10;
      const startRotation = target.rotation.y;
      const totalFrames = 15;
      let frame = 0;

      function animateUp() {
        const t = frame / totalFrames;
        target.position.y = startY + (endY - startY) * t;
        target.rotation.y = startRotation + Math.PI * 1.2 * t; // 20% faster spin
        frame++;

        if (frame <= totalFrames) {
          requestAnimationFrame(animateUp);
        } else {
          localStorage.setItem('lastViewedCoin', coinLabel);
          localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinLabel}.glb`);
          window.location.href = `${basePath}/coins/${coinLabel}.html`;
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
    localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinPage}.glb`);
    window.location.href = `${basePath}/coins/${coinPage}.html`;
  });
});

// === Hamburger Toggle (Mobile Menu) ===
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// === Touch Support ===
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
  const delta = clock.getDelta();
  controls.update();

  if (!isUserInteracting) {
    coinGroup.rotation.y += 0.0025;
  }

  coinMeshes.forEach((coin) => {
    coin.rotation.y += coin.userData.spinY * delta * 60;
    coin.rotation.x += coin.userData.spinX * delta * 60;

    if (!coin.userData.flyOut) {
      const time = clock.elapsedTime;
      const bob = Math.sin(time * 2 + coin.userData.bobOffset) * coin.userData.bobAmplitude;
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
        hoverSound.play().catch(() => {});
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
