import * as THREE from 'three';
import { getStarfield, addEarth, addSun } from './spaceEnvironment.js';
import { createMoon, createMoonAtmoshpere } from './moon.js';
import { positionCamera } from './cameras.js';
import { setupLighting } from './lighting.js';
import { Spacecraft, solarPanelsAnimation, createRobotArmsAnimation } from './spacecraft.js';
import { SPACECRAFT_CATALOG } from './spacecraft_catalog.js';
import { createLabelOverlay } from './label_overlay.js';
import { createFeatureInfoPanel } from './feature_info_panel.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// CONSTANTS & VARS
const moon_radius = 10;
const subjectWorldPos = new THREE.Vector3();
const previousTarget = new THREE.Vector3();
const targetDelta = new THREE.Vector3();
const offset = new THREE.Vector3();
const outward = new THREE.Vector3();
const perp = new THREE.Vector3();

let activeSpacecraftIndex = 0;
let activeSpacecraftEntry = SPACECRAFT_CATALOG[activeSpacecraftIndex];
let isSwitchingSpacecraft = false;
let spacecraft = null;
let spacecraft_solar_panels = null;
let sat_min_distance = 0.001;
const sat_minoutwardoffset = Math.max(moon_radius * 0.0005, 0.008);
let sat_camera_pos = null;
let robotArmAnimation = createRobotArmsAnimation();

// ─── Scene Setup ─────────────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const W = () => window.innerWidth;
const H = () => window.innerHeight;
 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// ─── Moon ───────────────────────────────────────────────────────────────────────────
const moon = createMoon(renderer, moon_radius);
scene.add(moon);
scene.add(createMoonAtmoshpere(moon_radius))
 

// ─── Space Environment ──────────────────────────────────────────────────────────────
const stars = getStarfield({numStars: 2000});
scene.add(stars);
addEarth(scene, moon_radius);
addSun(scene);

// ─── Lighting ───────────────────────────────────────────────────────────────────────
setupLighting(scene, moon_radius);

// ─── Cameras  ───────────────────────────────────────────────────────────────────────
function configureOrbitControls(controls, minDistance, maxDistance) {
  controls.enableDamping = true;
  controls.dampingFactor = 0.8;
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.8;
  controls.enablePan = false;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
}

function getOutwardOffset(subject, distance) {
  subject.getWorldPosition(subjectWorldPos);
  return subjectWorldPos.lengthSq() === 0
    ? new THREE.Vector3(0, 0, distance)
    : subjectWorldPos.clone().normalize().multiplyScalar(distance);
}

function updateTrackingOrbitCamera(camera, controls, subject, minDistance, minOutwardOffset) {
  previousTarget.copy(controls.target);
  subject.getWorldPosition(subjectWorldPos);

  targetDelta.subVectors(subjectWorldPos, previousTarget);
  camera.position.add(targetDelta);
  controls.target.copy(subjectWorldPos);
  controls.update();

  offset.subVectors(camera.position, subjectWorldPos);
  outward.copy(subjectWorldPos);
  if (outward.lengthSq() === 0) {
    outward.set(0, 0, 1);
  } else {
    outward.normalize();
  }

  if (offset.lengthSq() === 0) {
    offset.copy(outward).multiplyScalar(minDistance);
  }

  const outwardDistance = offset.dot(outward);
  perp.copy(offset).addScaledVector(outward, -outwardDistance);

  const safeOutwardDistance = Math.max(
    outwardDistance,
    minOutwardOffset,
    Math.sqrt(Math.max(minDistance * minDistance - perp.lengthSq(), 0))
  );

  offset.copy(perp).addScaledVector(outward, safeOutwardDistance);
  camera.position.copy(subjectWorldPos).add(offset);
  camera.lookAt(subjectWorldPos);
  controls.target.copy(subjectWorldPos);
}

// ─── Main Camera (Navigation) ───────────────────────────────────────────────────────
const nav_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
const nav_camera_pos = positionCamera(nav_camera, moon, new THREE.Vector3(moon_radius+10, 0, 0));
moon.add(nav_camera);

// ─── Main Camera Controls ───────────────────────────────────────────────────────────
const nav_controls = new OrbitControls(nav_camera, renderer.domElement);
nav_controls.target.copy(moon.position);
configureOrbitControls(nav_controls, 12, 50);

// ─── Secondary Camera (Satellite, orbit-controllable around the spacecraft) ─────────
const sat_camera = new THREE.PerspectiveCamera(60, W() / H(), 0.0001, 2000);
scene.add(sat_camera);

// ─── Satellite Camera Controls ──────────────────────────────────────────────────────
const sat_controls = new OrbitControls(sat_camera, renderer.domElement);
sat_controls.target.set(0, 0, 0);
configureOrbitControls(sat_controls, sat_min_distance, 12);

// ─── Orbiting Spacecraft ────────────────────────────────────────────────────────────
const spacecraftTitle = document.getElementById('spacecraft-title');
const spacecraftDescription = document.getElementById('spacecraft-description');
const spacecraftPage = document.getElementById('spacecraft-page');
const spacecraftPrevButton = document.getElementById('spacecraft-prev');
const spacecraftNextButton = document.getElementById('spacecraft-next');

async function setActiveSpacecraft(nextIndex) {
  if (isSwitchingSpacecraft) return;

  isSwitchingSpacecraft = true;
  spacecraftPrevButton.disabled = true;
  spacecraftNextButton.disabled = true;

  try {
    const nextEntry = SPACECRAFT_CATALOG[nextIndex];
    const nextSpacecraft = new Spacecraft(nextEntry.modelUrl, moon_radius + 1, { scale: nextEntry.scale, orientation: nextEntry.orientation });
    await nextSpacecraft.loadPromise;

    if (spacecraft) {
      scene.remove(spacecraft.model);
      robotArmAnimation.destroy();
    }

    spacecraft = nextSpacecraft;
    activeSpacecraftIndex = nextIndex;
    activeSpacecraftEntry = nextEntry;
    spacecraft_solar_panels = activeSpacecraftEntry.solarPanelPartName
      ? spacecraft.getModelPart(activeSpacecraftEntry.solarPanelPartName)
      : null;
    robotArmAnimation = createRobotArmsAnimation(
      activeSpacecraftEntry.hasRoboticArmControls ? spacecraft.model : null
    );

    scene.add(spacecraft.model);

    const spacecraftBounds = new THREE.Box3().setFromObject(spacecraft.model);
    const spacecraftSphere = new THREE.Sphere();
    spacecraftBounds.getBoundingSphere(spacecraftSphere);
    sat_min_distance = Math.max(spacecraftSphere.radius * 0.0001, 0.001);

    const sat_initial_distance = Math.max(1, sat_min_distance);
    sat_camera_pos = positionCamera(
      sat_camera,
      spacecraft.model,
      getOutwardOffset(spacecraft.model, sat_initial_distance)
    );
    spacecraft.model.getWorldPosition(subjectWorldPos);
    sat_controls.target.copy(subjectWorldPos);
    configureOrbitControls(sat_controls, sat_min_distance, 12);

    if (active_camera === sat_camera) {
      active_camera_pos = sat_camera_pos;
    }

    updateSpacecraftSelector();
  } finally {
    spacecraftPrevButton.disabled = false;
    spacecraftNextButton.disabled = false;
    isSwitchingSpacecraft = false;
  }
}

function updateSpacecraftSelector() {
  spacecraftTitle.textContent = activeSpacecraftEntry.name;
  spacecraftDescription.textContent = activeSpacecraftEntry.description;
  spacecraftPage.textContent = `${activeSpacecraftIndex + 1} / ${SPACECRAFT_CATALOG.length}`;
}


// ─── User Interaction ────────────────────────────────────────────────────────────────
let active_camera = nav_camera;
let active_camera_pos = nav_camera_pos;
await setActiveSpacecraft(activeSpacecraftIndex);

spacecraftPrevButton.addEventListener('click', async () => {
  await setActiveSpacecraft((activeSpacecraftIndex - 1 + SPACECRAFT_CATALOG.length) % SPACECRAFT_CATALOG.length);
});

spacecraftNextButton.addEventListener('click', async () => {
  await setActiveSpacecraft((activeSpacecraftIndex + 1) % SPACECRAFT_CATALOG.length);
});

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
const featurePanel = createFeatureInfoPanel();
const craterLabel = document.getElementById('crater-label');
const latLabel    = document.getElementById('lat');
const lonLabel    = document.getElementById('lon');
const cameraModeLabel = document.getElementById('camera-mode');
const spacecraftSelector = document.getElementById('spacecraft-selector');

labelOverlay.setOnFeatureClick(async feature => {
  await featurePanel.showFeature(feature);
});

//─── Animations ───────────────────────────────────────────────────────────────

function animate(){
  requestAnimationFrame(animate);
  nav_controls.update();

  //Spacecraft Orbit
  spacecraft.updateOrbitAnimation();
  updateTrackingOrbitCamera(sat_camera, sat_controls, spacecraft.model, sat_min_distance, sat_minoutwardoffset);

  //Spacecraft Animation
  if (spacecraft_solar_panels) {
    solarPanelsAnimation(spacecraft_solar_panels);
  }
  robotArmAnimation.update();
  active_camera_pos.updateLatLon();

  //currently active camera and navigation camera position update
  renderer.render(scene, active_camera);

  const isNavigatorCamera = active_camera === nav_camera;

  if (isNavigatorCamera) {
    // Update location HUD
    const latDeg = (nav_camera_pos.lat * 180 / Math.PI).toFixed(2);
    const lonDeg = (nav_camera_pos.lon * 180 / Math.PI).toFixed(2);
    const ns = latDeg >= 0 ? '' : '-';
    const ew = lonDeg >= 0 ? '' : '-';
    latLabel.textContent = `Lat: ${ns}${Math.abs(latDeg)}°`;
    lonLabel.textContent = `Lon: ${ew}${Math.abs(lonDeg)}°`;

    const crater = labelOverlay.getNearestFeature(nav_camera_pos.lat, nav_camera_pos.lon);
    craterLabel.textContent = crater ? crater.name : '—';
    craterLabel.style.opacity = crater ? '1' : '0.3';
  } else {
    craterLabel.textContent = activeSpacecraftEntry.hasRoboticArmControls
      ? 'ROBOT ARM CONTROLS'
      : activeSpacecraftEntry.name.toUpperCase();
    craterLabel.style.opacity = '1';
    latLabel.textContent = activeSpacecraftEntry.hasRoboticArmControls
      ? 'Q/A Arm1 • W/S Arm2 • E/D Arm3'
      : 'Orbiting lunar spacecraft';
    lonLabel.textContent = activeSpacecraftEntry.hasRoboticArmControls
      ? 'R/F Arm4 • T/G Arm5'
      : 'Use arrows to change model';
  }

  // Update camera mode display
  cameraModeLabel.textContent = `CAMERA: ${isNavigatorCamera ? 'NAVIGATOR' : 'SPACECRAFT'}`;
  spacecraftSelector.style.display = isNavigatorCamera ? 'none' : 'grid';

  // Update 3D labels on screen
  labelOverlay.update(active_camera, active_camera_pos);
}

animate();
