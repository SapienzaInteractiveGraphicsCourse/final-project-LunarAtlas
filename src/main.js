import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './create_moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { Camera } from './camera.js';
import { setupLighting } from './lighting.js';
import { Spacecraft} from './spacecraft.js';
import { FEATURES } from './features_database.js';
import { createLabelOverlay } from './label_overlay.js';

// CONSTANTS & VARS
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
const nav_camera = new Camera(renderer, W, H, moon, moon_radius+10, false);
scene.add(nav_camera.cam);
moon.add(nav_camera.cam);
let active_camera = nav_camera;
let active_camera_name = "navigator";

// ─── Secondary Camera (Spacecraft Follower) ───────────────────────────────────────
const sat_camera = new Camera(renderer, W, H, spacecraft.model, 5, true);
scene.add(sat_camera.cam);
spacecraft.model.add(sat_camera.cam);

// spacecraft_camera.position.set(10, 10, -10);
// spacecraft_camera.lookAt(spacecraft.model.position);

// Handle Apollo camera resizing
// window.addEventListener('resize', () => {
//   spacecraft_camera.aspect = W() / H();
//   spacecraft_camera.updateProjectionMatrix();
// });

document.getElementById('loading').classList.add('hidden');

window.addEventListener('keydown', (e) => {
  
  // Camera switching with 'C' key
  if (e.key.toLowerCase() === 'c') {
    if(active_camera === nav_camera) active_camera = sat_camera;
    else if(active_camera === sat_camera) active_camera = nav_camera;

    active_camera_name = active_camera === nav_camera ? 'navigator' : 'spacecraft';
    console.log('Switched to', active_camera_name, 'camera');
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
  renderer.render(scene, active_camera.cam);

  active_camera.camPosition();
  
  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();

  // Update location HUD
  const latDeg = (active_camera.navigator.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (active_camera.navigator.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? '' : '-';
  const ew = lonDeg >= 0 ? '' : '-';
  latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
  lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

  const crater = labelOverlay.getNearestCrater(active_camera.navigator.lat, active_camera.navigator.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${active_camera_name.toUpperCase()}`;

  // Update 3D labels on screen
  labelOverlay.update(active_camera.cam, active_camera);
}

animate();