import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildStars } from './starfield.js';
import { createMoon } from './moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { createNavigatorCamera, createFollowerCamera } from './cameras.js';
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
const spacecraft = new Spacecraft('./src/assets/gateway_core.glb', moon_radius +1);
await spacecraft.loadPromise;

scene.add(spacecraft.model);

// ─── Cameras  ──────────────────────────────────────────────────────────────────

// ─── Main Camera (Navigation) ─────────────────────────────────────────────────
const nav_camera = createNavigatorCamera(renderer, W, H, moon, moon_radius + 10);
moon.add(nav_camera.cam);

let active_camera = nav_camera;
let active_camera_name = "navigator";

// ─── Secondary Camera (Spacecraft Follower) ───────────────────────────────────────
const sat_camera = createFollowerCamera(renderer, W, H, spacecraft.model, 0.3);

spacecraft.model.add(sat_camera.cam);
sat_camera.update();

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

  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();

  // Keep the spacecraft-follower camera locked on the subject with the
  // moon behind it, even as the spacecraft moves/rotates along its orbit.
  active_camera.update();

  //currently active camera and navigation camera position update
  renderer.render(scene, active_camera.cam);

  // Update location HUD
  const latDeg = (active_camera.state.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (active_camera.state.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? '' : '-';
  const ew = lonDeg >= 0 ? '' : '-';
  latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
  lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

  const crater = labelOverlay.getNearestCrater(active_camera.state.lat, active_camera.state.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${active_camera_name.toUpperCase()}`;

  // Update 3D labels on screen
  labelOverlay.update(active_camera.cam, active_camera);
}

animate();