import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './create_moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { Camera } from './camera.js';
import { setupLighting } from './lighting.js';
import { Spacecraft} from './spacecraft.js';
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


// ─── Starfield ────────────────────────────────────────────────────────────────
buildStars(scene);

// ─── Moon ─────────────────────────────────────────────────────────────────────
const moon = createMoon(renderer, moon_radius);
scene.add(moon);

// ─── Moon Atmosphere ───────────────────────────────────────────────────────────
scene.add(createMoonAtmoshpere(moon_radius))
 
// ─── Lighting ─────────────────────────────────────────────────────────────────
// Ambient (deep space faint light)
setupLighting(scene);
 
// ─── Orbiting Spacecraft ──────────────────────────────────────────────────────────
const spacecraft = new Spacecraft('./src/assets/apollo_lunar_module.glb', moon_radius +1);
await spacecraft.loadPromise;

scene.add(spacecraft.model);

// ─── Cameras  ──────────────────────────────────────────────────────────────────

// ─── Main Camera (Navigation) ─────────────────────────────────────────────────
const camera = new Camera(renderer, W, H, moon, moon_radius +10);
scene.add(camera.cam);
//camera.position.set(0, 0, 3.5);

// ─── Secondary Camera (Spacecraft Follower) ───────────────────────────────────────
const spacecraft_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000);
let activeCamera = camera.cam;
let cameraMode = 'navigator'; 

spacecraft.model.add(spacecraft_camera);
spacecraft_camera.position.set(10, 10, -10);
spacecraft_camera.lookAt(spacecraft.model.position);

// Handle Apollo camera resizing
window.addEventListener('resize', () => {
  spacecraft_camera.aspect = W() / H();
  spacecraft_camera.updateProjectionMatrix();
});

document.getElementById('loading').classList.add('hidden');

window.addEventListener('keydown', (e) => {
  
  // Camera switching with 'C' key
  if (e.key.toLowerCase() === 'c') {
    cameraMode = cameraMode === 'navigator' ? 'apollo' : 'navigator';
    activeCamera = cameraMode === 'navigator' ? camera.cam : spacecraft_camera;
    activeCamera.aspect = W() / H();
    activeCamera.updateProjectionMatrix();
    console.log('Switched to', cameraMode, 'camera');
  }
});

// ─── Labels ─────────────────────────────────────────────────────────
const labelOverlay = createLabelOverlay(moon_radius); //3D Label Overlay
const craterLabel = document.getElementById('crater-label');
const latLabel    = document.getElementById('lat');
const lonLabel    = document.getElementById('lon');
const cameraModeLabel = document.getElementById('camera-mode');

//─── Animations ───────────────────────────────────────────────────────────────

function animate(){
  requestAnimationFrame(animate);

  //currently active camera and navigation camera position update
  renderer.render(scene, activeCamera);
  camera.processWalk();
  camera.updateCamera();
  
  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();

  // Update location HUD
  const latDeg = (camera.navigator.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (camera.navigator.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? '' : '-';
  const ew = lonDeg >= 0 ? '' : '-';
  latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
  lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

  const crater = labelOverlay.getNearestCrater(camera.navigator.lat, camera.navigator.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${cameraMode.toUpperCase()}`;

  // Update 3D labels on screen
  labelOverlay.update(activeCamera, camera);
}

animate();