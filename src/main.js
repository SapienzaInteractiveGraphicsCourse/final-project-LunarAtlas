import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './create_moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { CameraControl } from './camera_controls.js';
import { setupLighting } from './lighting.js';
import { Spacecraft} from './spacecraft.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FEATURES } from './features_database.js';
import { createLabelOverlay } from './label_overlay.js';

// CONSTANTS
const moon_radius = 10;

// ─── Scene Setup ─────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const W = () => window.innerWidth;
const H = () => window.innerHeight;
 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
 
const scene = new THREE.Scene();
 
const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 1000);
camera.position.set(0, 0, 3.5);

// ─── Secondary Camera (Apollo Follower) ───────────────────────────────────────
const spacecraft_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000);
let activeCamera = camera;
let cameraMode = 'walker'; // 'walker' or 'apollo'
 
// ─── Starfield ────────────────────────────────────────────────────────────────
buildStars(scene);

// ─── Moon ────────────────────────────────────────────────────────────────
const moon = createMoon(renderer, moon_radius);
scene.add(moon);

// Subtle Atmosphere Glow
scene.add(createMoonAtmoshpere(moon_radius))
 

// ─── Lighting ─────────────────────────────────────────────────────────────────
// Ambient (deep space faint light)
setupLighting(scene);
 
// ─── Orbiting Spacecraft ──────────────────────────────────────────────────────────
const spacecraft = new Spacecraft('./src/assets/apollo_lunar_module.glb', moon_radius +1);
await spacecraft.loadPromise;
//spacecraft.setPositionFromVector(camera.position);
spacecraft.model.add(spacecraft_camera);
scene.add(spacecraft.model);

spacecraft_camera.position.set(10, 10, -10);
spacecraft_camera.lookAt(spacecraft.model.position);

// ─── Camera Controls (manual implementation) ──────────────────────────────────

const ctrl = new CameraControl(renderer, camera, W, H, moon_radius);

// Handle Apollo camera resizing
window.addEventListener('resize', () => {
  spacecraft_camera.aspect = W() / H();
  spacecraft_camera.updateProjectionMatrix();
});

document.getElementById('loading').classList.add('hidden');
ctrl.updateCamera();

// Close popup on ESC
window.addEventListener('keydown', (e) => {
  
  // Camera switching with 'C' key
  if (e.key.toLowerCase() === 'c') {
    cameraMode = cameraMode === 'walker' ? 'apollo' : 'walker';
    activeCamera = cameraMode === 'walker' ? camera : spacecraft_camera;
    activeCamera.aspect = W() / H();
    activeCamera.updateProjectionMatrix();
    console.log('Switched to', cameraMode, 'camera');
  }
});

// ─── 3D Label Overlay ─────────────────────────────────────────────────────────
const labelOverlay = createLabelOverlay(moon_radius);

//─── Animations ───────────────────────────────────────────────────────────────

const craterLabel = document.getElementById('crater-label');
const latLabel    = document.getElementById('lat');
const lonLabel    = document.getElementById('lon');
const cameraModeLabel = document.getElementById('camera-mode');

function animate(){
  requestAnimationFrame(animate);
  ctrl.processWalk();
  ctrl.updateCamera();
  
  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();

  renderer.render(scene, activeCamera);

  // Update location HUD
  const latDeg = (ctrl.walker.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (ctrl.walker.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? '' : '-';
  const ew = lonDeg >= 0 ? '' : '-';
  latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
  lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

  const crater = labelOverlay.getNearestCrater(ctrl.walker.lat, ctrl.walker.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${cameraMode.toUpperCase()}`;

  // Update 3D labels on screen
  labelOverlay.update(activeCamera, ctrl);
}

animate();