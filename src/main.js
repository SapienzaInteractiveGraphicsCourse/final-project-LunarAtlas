import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './create_moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { CameraControl } from './camera_controls.js';
import { setupLighting } from './lighting.js';
import { Spacecraft} from './spacecraft.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FEATURES } from './features_database.js';

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
const labelContainer = document.getElementById('label-container');
const _labelVec = new THREE.Vector3();

// Pre-compute 3D positions for each feature (on moon surface, accounting for moon.rotation.y)
const featureData = FEATURES.map(f => {
  const latR = f.lat * Math.PI / 180;
  const lonR = f.lon * Math.PI / 180;
  
  const worldPos = new THREE.Vector3(
    moon_radius * Math.cos(latR) * Math.sin(lonR),
    moon_radius * Math.sin(latR),
    moon_radius * Math.cos(latR) * Math.cos(lonR)
  );
  const el = document.createElement('div');
  el.className = `moon-label moon-label--${f.type}`;
  el.innerHTML = `<span class="moon-label__dot"></span><span class="moon-label__text">${f.name}</span>`;
  labelContainer.appendChild(el);
  return { ...f, worldPos, el };
});

function updateLabels() {
  const camDir = new THREE.Vector3();
  activeCamera.getWorldDirection(camDir);
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Altitude-based scale: full size at zoom ~12, fade at far zoom
  const alt = ctrl.walker.altitude;
  const scaleFactor = Math.max(0.6, Math.min(1.2, 20 / alt));

  for (const f of featureData) {
    // Surface normal at feature = normalized world position
    const normal = f.worldPos.clone().normalize();
    // Dot with camera direction: if < 0 the feature faces toward camera
    const dot = normal.dot(camDir);

    // Hide if on far side (dot > 0 means normal faces away from camera view)
    // Add a small margin (~0.1) to hide features near the limb
    if (dot > -0.08) {
      f.el.style.display = 'none';
      continue;
    }

    // Project to screen space
    _labelVec.copy(f.worldPos);
    _labelVec.project(activeCamera);

    const sx = ( _labelVec.x * 0.5 + 0.5) * w;
    const sy = (-_labelVec.y * 0.5 + 0.5) * h;

    // Hide if outside screen
    if (sx < 0 || sx > w || sy < 0 || sy > h) {
      f.el.style.display = 'none';
      continue;
    }

    // Fade features near the limb (dot between -0.08 and -0.25)
    const opacity = Math.min(1, (Math.abs(dot) - 0.08) / 0.17);

    f.el.style.display = 'flex';
    f.el.style.transform = `translate(${sx}px, ${sy}px) scale(${scaleFactor})`;
    f.el.style.opacity = opacity.toFixed(3);
  }
}

// Great-circle angular distance between two lat/lon points (degrees→rad internally)
function angularDist(lat1, lon1, lat2, lon2) {
  const toR = Math.PI / 180;
  const la1 = lat1 * toR, lo1 = lon1 * toR, la2 = lat2 * toR, lo2 = lon2 * toR;
  const dLat = la2 - la1, dLon = lo2 - lo1;
  const a = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * Math.asin(Math.sqrt(a));
}

function getNearestCrater(lat, lon) {
  // lat/lon here are in radians from the walker
  const latD = lat * 180 / Math.PI;
  const lonD = lon * 180 / Math.PI;
  let best = null, bestDist = Infinity;
  for (const f of FEATURES) {
    const d = angularDist(latD, lonD, f.lat, f.lon);
    if (d < bestDist) { bestDist = d; best = f; }
  }
  return bestDist < 15 ? best : null;
}

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

  const crater = getNearestCrater(ctrl.walker.lat, ctrl.walker.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${cameraMode.toUpperCase()}`;

  // Update 3D labels on screen
  updateLabels();
}

animate();