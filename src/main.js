import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './createMoon.js';
import { CameraControl } from './camera_controls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

// Simple seedable RNG (mulberry32)
// function mulberry32(seed) {
//   return function() {
//     seed |= 0; seed = seed + 0x6D2B79F5 | 0;
//     let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
//     t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
//     return ((t ^ t >>> 14) >>> 0) / 4294967296;
//   };
// }
 
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
scene.add(new THREE.AmbientLight(0xffffff, 1));
 
// Main sunlight (directional)
const sun = new THREE.DirectionalLight(0xfff5e8, 2.2);
sun.position.set(5, 2, 3);
sun.castShadow = true;
sun.shadow.mapSize.width  = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);
 
// Subtle earthshine (blue-ish fill from opposite side)
const earthshine = new THREE.DirectionalLight(0x4466aa, 0.12);
earthshine.position.set(-4, -1, -2);
scene.add(earthshine);

 
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
 
// ─── Feature Database (lat/lon in degrees, type: 'crater' | 'mare' | 'landing') ──
const FEATURES = [
  // Craters
  { name: "Tycho",              lat: -43.3, lon:  -11.2, type: 'crater' },
  { name: "Copernicus",         lat:   9.7, lon:  -20.1, type: 'crater' },
  { name: "Plato",              lat:  51.6, lon:   -9.4, type: 'crater' },
  { name: "Clavius",            lat: -58.4, lon:  -14.1, type: 'crater' },
  { name: "Kepler",             lat:   8.1, lon:  -38.0, type: 'crater' },
  { name: "Aristarchus",        lat:  23.7, lon:  -47.4, type: 'crater' },
  { name: "Eratosthenes",       lat:  14.5, lon:  -11.3, type: 'crater' },
  { name: "Grimaldi",           lat:  -5.5, lon:  -68.3, type: 'crater' },
  { name: "Schickard",          lat: -44.4, lon:  -54.6, type: 'crater' },
  { name: "Ptolemaeus",         lat:  -9.2, lon:   -1.8, type: 'crater' },
  { name: "Alphonsus",          lat: -13.4, lon:   -2.8, type: 'crater' },
  { name: "Arzachel",           lat: -18.2, lon:   -1.9, type: 'crater' },
  { name: "Theophilus",         lat: -11.4, lon:   26.4, type: 'crater' },
  { name: "Langrenus",          lat:  -8.9, lon:   61.1, type: 'crater' },
  { name: "Tycho",              lat: -43.3, lon:  -11.2, type: 'crater' },
  { name: "Stevinus",           lat: -32.5, lon:   54.2, type: 'crater' },
  { name: "Petavius",           lat: -25.1, lon:   60.4, type: 'crater' },
  { name: "Furnerius",          lat: -36.0, lon:   60.4, type: 'crater' },
  { name: "Fracastorius",       lat: -21.2, lon:   33.0, type: 'crater' },
  { name: "Maurolycus",         lat: -41.8, lon:   14.0, type: 'crater' },
  { name: "Walter",             lat: -33.1, lon:   -1.0, type: 'crater' },
  { name: "Maginus",            lat: -50.5, lon:   -6.3, type: 'crater' },
  { name: "Longomontanus",      lat: -49.6, lon:  -21.8, type: 'crater' },
  { name: "Wilhelm",            lat: -43.4, lon:  -20.4, type: 'crater' },
  { name: "Pitatus",            lat: -29.9, lon:  -13.5, type: 'crater' },
  { name: "Bullialdus",         lat: -20.7, lon:  -22.2, type: 'crater' },
  { name: "Gassendi",           lat: -17.5, lon:  -40.1, type: 'crater' },
  { name: "Hansteen",           lat: -11.5, lon:  -52.0, type: 'crater' },
  { name: "Hevelius",           lat:   2.2, lon:  -67.6, type: 'crater' },
  { name: "Reiner",             lat:   7.0, lon:  -54.9, type: 'crater' },
  { name: "Marius",             lat:  11.9, lon:  -50.8, type: 'crater' },
  { name: "Pytheas",            lat:  20.5, lon:  -20.6, type: 'crater' },
  { name: "Archimedes",         lat:  29.7, lon:   -4.0, type: 'crater' },
  { name: "Timocharis",         lat:  26.7, lon:  -13.1, type: 'crater' },
  { name: "Lambert",            lat:  25.8, lon:  -21.0, type: 'crater' },
  { name: "Euler",              lat:  23.3, lon:  -29.2, type: 'crater' },
  { name: "Aristillus",         lat:  33.9, lon:   1.2,  type: 'crater' },
  { name: "Autolycus",          lat:  30.7, lon:    1.5, type: 'crater' },
  { name: "Cassini",            lat:  40.2, lon:    4.6, type: 'crater' },
  { name: "Eudoxus",            lat:  44.3, lon:   16.2, type: 'crater' },
  { name: "Aristoteles",        lat:  50.2, lon:   17.4, type: 'crater' },
  { name: "Endymion",           lat:  53.9, lon:   56.5, type: 'crater' },
  { name: "Atlas",              lat:  46.7, lon:   44.4, type: 'crater' },
  { name: "Hercules",           lat:  46.7, lon:   39.1, type: 'crater' },
  { name: "Posidonius",         lat:  31.8, lon:   29.9, type: 'crater' },
  { name: "Cleomedes",          lat:  27.7, lon:   55.5, type: 'crater' },
  // Maria (seas)
  { name: "Mare Imbrium",       lat:  32.8, lon:  -15.6, type: 'mare' },
  { name: "Mare Tranquillitatis", lat: 8.5, lon:   31.4, type: 'mare' },
  { name: "Mare Serenitatis",   lat:  28.0, lon:   17.5, type: 'mare' },
  { name: "Oceanus Procellarum",lat:  18.4, lon:  -57.4, type: 'mare' },
  { name: "Mare Crisium",       lat:  17.0, lon:   59.1, type: 'mare' },
  { name: "Mare Nubium",        lat: -21.3, lon:  -16.6, type: 'mare' },
  { name: "Mare Humorum",       lat: -24.4, lon:  -38.6, type: 'mare' },
  { name: "Mare Fecunditatis",  lat:  -7.8, lon:   51.3, type: 'mare' },
  { name: "Mare Vaporum",       lat:  13.3, lon:    3.6, type: 'mare' },
  { name: "Mare Frigoris",      lat:  56.0, lon:    1.4, type: 'mare' },
  { name: "Mare Marginis",      lat:  13.3, lon:   86.1, type: 'mare' },
  { name: "Mare Anguis",        lat:  22.6, lon:   67.7, type: 'mare' },
  // Apollo Landing Sites
  { name: "Apollo 11",          lat:   0.67, lon:  23.47, type: 'landing' },
  { name: "Apollo 12",          lat:  -3.01, lon: -23.42, type: 'landing' },
  { name: "Apollo 14",          lat:  -3.64, lon: -17.47, type: 'landing' },
  { name: "Apollo 15",          lat:  26.13, lon:   3.63, type: 'landing' },
  { name: "Apollo 16",          lat:  -8.97, lon:  15.50, type: 'landing' },
  { name: "Apollo 17",          lat:  20.19, lon:  30.77, type: 'landing' },
];

// ─── 3D Label Overlay ─────────────────────────────────────────────────────────
const labelContainer = document.getElementById('label-container');
const _labelVec = new THREE.Vector3();

// Pre-compute 3D positions for each feature (on moon surface, accounting for moon.rotation.y)
const featureData = FEATURES.map(f => {
  const latR = f.lat * Math.PI / 180;
  const lonR = f.lon * Math.PI / 180;
  // Moon is rotated -PI/2 on Y, so we counter-rotate the lon
  const adjLon = lonR + Math.PI / 2;
  const worldPos = new THREE.Vector3(
    moon_radius * Math.cos(latR) * Math.cos(adjLon),
    moon_radius * Math.sin(latR),
    moon_radius * Math.cos(latR) * Math.sin(adjLon)
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