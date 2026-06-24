import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { createMoon } from './moon.js';
import { createMoonAtmoshpere } from './moon_atmosphere.js';
import { positionCamera, updateLatLon, createSatelliteCamera } from './cameras.js';
import { setupLighting } from './lighting.js';
import { Spacecraft, solarPanelsAnimation } from './spacecraft.js';
import { createLabelOverlay } from './label_overlay.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

const spacecraft_solar_panels = spacecraft.getModelPart("Maxar_PPE_Array");

// ─── Cameras  ────────────────────────────────────────────────────────────────────

// ─── Main Camera (Navigation) ────────────────────────────────────────────────────
const nav_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
const nav_camera_pos = positionCamera(nav_camera, moon, new THREE.Vector3(moon_radius+10, 0, 0));
moon.add(nav_camera);

// Navigation Camera Controls
const nav_controls = new OrbitControls(nav_camera, renderer.domElement);
nav_controls.target.copy(moon.position);
nav_controls.enableDamping = true;
nav_controls.dampingFactor = 0.8;
nav_controls.rotateSpeed = 0.4;
nav_controls.zoomSpeed = 0.8;
nav_controls.enablePan = false; // dragging should only orbit
nav_controls.minDistance = 12;
nav_controls.maxDistance = 50;

// ─── Secondary Camera (Satellite, orbit-controllable around the spacecraft) ──────
const sat_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
const sat_camera_pos = positionCamera(sat_camera, spacecraft.model, new THREE.Vector3(1, 0, 0));

scene.add(sat_camera);

// Satellite Camera Controls
const sat_controls = new OrbitControls(sat_camera, renderer.domElement);
sat_controls.target.copy(spacecraft.model.position);
sat_controls.enableDamping = true;
sat_controls.dampingFactor = 0.8;
sat_controls.rotateSpeed = 0.4;
sat_controls.zoomSpeed = 0.8;
sat_controls.enablePan = false; // dragging should only orbit
sat_controls.minDistance = 12;
sat_controls.maxDistance = 30;

//Other stuff
let active_camera = nav_camera;
let active_camera_name = "navigator";

document.getElementById('loading').classList.add('hidden');

window.addEventListener('keydown', (e) => {
  
  // Camera switching with 'C' key
  if (e.key.toLowerCase() === 'c') {
    if(active_camera === nav_camera) active_camera = sat_camera;
    else if(active_camera === sat_camera) active_camera = nav_camera;
    console.log('Switched to', active_camera === nav_camera ? 'navigator' : 'spacecraft', 'camera');
  }
});

window.addEventListener('resize', () => {
  [nav_camera, sat_camera].forEach(cam => {
    cam.aspect = W() / H();
    cam.updateProjectionMatrix();
  });
  renderer.setSize(W(), H());
});

// ─── Labels ──────────────────────────────────────────────────────────────────
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

  //Spacecraft Animation
  solarPanelsAnimation(spacecraft_solar_panels);
  updateLatLon(nav_camera, moon, nav_camera_pos);

  //currently active camera and navigation camera position update
  renderer.render(scene, nav_camera);

  // Update location HUD
  // const latDeg = (active_camera.state.lat * 180 / Math.PI).toFixed(2);
  // const lonDeg = (active_camera.state.lon * 180 / Math.PI).toFixed(2);
  // const ns = latDeg >= 0 ? '' : '-';
  // const ew = lonDeg >= 0 ? '' : '-';
  // latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
  // lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

  // const crater = labelOverlay.getNearestCrater(active_camera.state.lat, active_camera.state.lon);
  // craterLabel.textContent  = crater ? crater.name : '—';
  // craterLabel.style.opacity = crater ? '1' : '0.3';

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${active_camera === nav_camera ? 'NAVIGATOR' : 'SPACECRAFT'}`;

  // Update 3D labels on screen
  labelOverlay.update(nav_camera, nav_camera_pos);
}

animate();