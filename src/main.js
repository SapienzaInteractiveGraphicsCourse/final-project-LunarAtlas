import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './create_moon.js';
import { CameraControl } from './camera_controls.js';
import { setupLighting } from './lighting.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FEATURES } from './features_database.js';

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
 
// ─── Starfield ────────────────────────────────────────────────────────────────
buildStars(scene);

// ─── Moon ────────────────────────────────────────────────────────────────
const moon_radius = 10;
const moon = createMoon(renderer, moon_radius);

scene.add(moon);

// ─── Subtle Atmosphere Glow ───────────────────────────────────────────────────
const atmGeo = new THREE.SphereGeometry(moon_radius+0.2, 64, 64);
const atmMat = new THREE.MeshBasicMaterial({
  color: 0xaabbdd,
  transparent: true,
  opacity: 0.035,
  side: THREE.FrontSide,
  depthWrite: false,
});
scene.add(new THREE.Mesh(atmGeo, atmMat));
 

// ─── Lighting ─────────────────────────────────────────────────────────────────
// Ambient (deep space faint light)
setupLighting(scene);
 
//  ─── Apollo Lunar Module ──────────────────────────────────────────────────────────
const GLBLoader = new GLTFLoader();
let lm = null;

GLBLoader.load(
  './src/assets/apollo_lunar_module.glb',
  (gltf) => {
    lm = gltf.scene;
    lm.position.copy(camera.position);
    lm.scale.set(0.05, 0.05, 0.05);
    lm.rotateZ(-Math.PI / 2);
    scene.add(lm);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    console.error('Error loading GLB:', error);
  }
);

// Orbit Animation
let orbit_lon = 0;          // radians
let orbit_lat = 0;          // radians (optional)
const orbit_radius = moon_radius + 1.5; // distance from moon surface
const orbit_speed = 0.005; // tweak for speed

function OrbitingAnimation(){
  if (!lm) return;
  orbit_lon += orbit_speed;

  // Optional: add slight inclination
  //orbit_lat = Math.sin(orbit_lon * 0.3) * 0.1;

  const x = orbit_radius * Math.cos(orbit_lat) * Math.cos(orbit_lon);
  const y = orbit_radius * Math.sin(orbit_lat);
  const z = orbit_radius * Math.cos(orbit_lat) * Math.sin(orbit_lon);

  lm.position.set(x, y, z);
  
  // face the moon the right way
  lm.lookAt(0, 0, 0);
  lm.rotateZ(Math.PI / 2);
}

// ─── Camera Controls (manual implementation) ──────────────────────────────────

const ctrl = new CameraControl(renderer, camera, W, H, moon_radius);

document.getElementById('loading').classList.add('hidden');
ctrl.updateCamera();

// ─── Right-Click Landing System ───────────────────────────────────────────
const landingPopup = document.getElementById('landing-popup');
const landingCoords = document.getElementById('landing-popup-coords');
const landingBtnConfirm = document.getElementById('landing-btn-confirm');
const landingBtnCancel = document.getElementById('landing-btn-cancel');

let pendingLanding = null;

function screenToMoonCoords(screenX, screenY) {
  // Normalize to NDC (-1 to 1)
  const x = (screenX / W()) * 2 - 1;
  const y = -(screenY / H()) * 2 + 1;
  
  // Create ray from camera through the screen point
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  // Intersect with moon sphere
  const moonSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), moon_radius);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectSphere(moonSphere, intersection);
  
  if (!intersection) return null;
  
  // Convert 3D world position to lat/lon
  const lat = Math.asin(intersection.y / moon_radius);
  const lon = Math.atan2(intersection.x, intersection.z);
  
  return { lat, lon, x: intersection.x, y: intersection.y, z: intersection.z };
}

function showLandingPopup(screenX, screenY, coords) {
  const latDeg = (coords.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (coords.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? 'N' : 'S';
  const ew = lonDeg >= 0 ? 'E' : 'W';
  
  landingCoords.innerHTML = `
    LAT: ${ns}${Math.abs(latDeg)}°<br>
    LON: ${ew}${Math.abs(lonDeg)}°
  `;
  
  landingPopup.classList.add('visible');
  landingPopup.style.left = screenX + 'px';
  landingPopup.style.top = screenY + 'px';
  
  pendingLanding = { lat: coords.lat, lon: coords.lon };
}

function hideLandingPopup() {
  landingPopup.classList.remove('visible');
  pendingLanding = null;
}

function confirmLanding() {
  if (!pendingLanding) return;
  
  ctrl.walker.lat = pendingLanding.lat;
  ctrl.walker.lon = pendingLanding.lon;
  ctrl.walker.targetAltitude = Math.max(2.5, Math.min(8, ctrl.walker.altitude));
  
  hideLandingPopup();
}

container.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  
  const coords = screenToMoonCoords(e.clientX, e.clientY);
  if (coords) {
    showLandingPopup(e.clientX, e.clientY, coords);
  }
});

landingBtnConfirm.addEventListener('click', confirmLanding);
landingBtnCancel.addEventListener('click', hideLandingPopup);

// Close popup on ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideLandingPopup();
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
  camera.getWorldDirection(camDir);
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
    _labelVec.project(camera);

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

function animate(){
  requestAnimationFrame(animate);
  ctrl.processWalk();
  ctrl.updateCamera();
  renderer.render(scene,camera);

  //Orbiting Animation
  OrbitingAnimation();

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

  // Update 3D labels on screen
  updateLabels();
}

animate();