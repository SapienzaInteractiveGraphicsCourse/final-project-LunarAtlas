import * as THREE from 'three';
import { getStarfield, addEarthAndSun } from './starfield.js';
import { createMoon, createMoonAtmoshpere } from './moon.js';
import { positionCamera, updateLatLon } from './cameras.js';
import { setupLighting } from './lighting.js';
import { Spacecraft, solarPanelsAnimation } from './spacecraft.js';
import { createLabelOverlay } from './label_overlay.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// CONSTANTS & VARS
const moon_radius = 10;
const _subjectWorldPos = new THREE.Vector3();
const _previousTarget = new THREE.Vector3();
const _targetDelta = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _outward = new THREE.Vector3();
const _perp = new THREE.Vector3();

function configureOrbitControls(controls, minDistance, maxDistance) {
  controls.enableDamping = true;
  controls.dampingFactor = 0.8;
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.8;
  controls.enablePan = false; // dragging should only orbit
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
}

function getOutwardOffset(subject, distance) {
  subject.getWorldPosition(_subjectWorldPos);
  return _subjectWorldPos.lengthSq() === 0
    ? new THREE.Vector3(0, 0, distance)
    : _subjectWorldPos.clone().normalize().multiplyScalar(distance);
}

function updateTrackingOrbitCamera(camera, controls, subject, minDistance, minOutwardOffset) {
  _previousTarget.copy(controls.target);
  subject.getWorldPosition(_subjectWorldPos);

  _targetDelta.subVectors(_subjectWorldPos, _previousTarget);
  camera.position.add(_targetDelta);
  controls.target.copy(_subjectWorldPos);
  controls.update();

  _offset.subVectors(camera.position, _subjectWorldPos);
  _outward.copy(_subjectWorldPos);
  if (_outward.lengthSq() === 0) {
    _outward.set(0, 0, 1);
  } else {
    _outward.normalize();
  }

  if (_offset.lengthSq() === 0) {
    _offset.copy(_outward).multiplyScalar(minDistance);
  }

  const outwardDistance = _offset.dot(_outward);
  _perp.copy(_offset).addScaledVector(_outward, -outwardDistance);

  const safeOutwardDistance = Math.max(
    outwardDistance,
    minOutwardOffset,
    Math.sqrt(Math.max(minDistance * minDistance - _perp.lengthSq(), 0))
  );

  _offset.copy(_perp).addScaledVector(_outward, safeOutwardDistance);
  camera.position.copy(_subjectWorldPos).add(_offset);
  camera.lookAt(_subjectWorldPos);
  controls.target.copy(_subjectWorldPos);
}

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
const stars = getStarfield({numStars: 2000});
scene.add(stars);
addEarthAndSun(scene);

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
configureOrbitControls(nav_controls, 12, 50);

// ─── Secondary Camera (Satellite, orbit-controllable around the spacecraft) ──────
const spacecraft_bounds = new THREE.Box3().setFromObject(spacecraft.model);
const spacecraft_sphere = new THREE.Sphere();
spacecraft_bounds.getBoundingSphere(spacecraft_sphere);

const sat_min_distance = Math.max(spacecraft_sphere.radius * 0.6, 0.15);
const sat_min_outward_offset = Math.max(moon_radius * 0.005, 0.08);
const sat_initial_distance = Math.max(1, sat_min_distance);

const sat_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
const sat_camera_pos = positionCamera(sat_camera, spacecraft.model, getOutwardOffset(spacecraft.model, sat_initial_distance));

scene.add(sat_camera);

// Satellite Camera Controls
const sat_controls = new OrbitControls(sat_camera, renderer.domElement);
spacecraft.model.getWorldPosition(_subjectWorldPos);
sat_controls.target.copy(_subjectWorldPos);
configureOrbitControls(sat_controls, sat_min_distance, 12);

//Other stuff
let active_camera = nav_camera;
let active_camera_pos = nav_camera_pos;

document.getElementById('loading').classList.add('hidden');

window.addEventListener('keydown', (e) => {
  
  // Camera switching with 'C' key
  if (e.key.toLowerCase() === 'c') {
    if(active_camera === nav_camera) {
      active_camera = sat_camera;
      active_camera_pos = sat_camera_pos;
    }
    else if(active_camera === sat_camera){
      active_camera = nav_camera;
      active_camera_pos = nav_camera_pos;
    }
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

function animate(t = 0){
  requestAnimationFrame(animate);
  nav_controls.update();

  // Stars animation
  stars.userData.update(t);

  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();
  updateTrackingOrbitCamera(sat_camera, sat_controls, spacecraft.model, sat_min_distance, sat_min_outward_offset);

  //Spacecraft Animation
  solarPanelsAnimation(spacecraft_solar_panels);
  updateLatLon(active_camera, active_camera_pos);

  //currently active camera and navigation camera position update
  renderer.render(scene, active_camera);

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
  labelOverlay.update(active_camera, active_camera_pos);
}

animate();
