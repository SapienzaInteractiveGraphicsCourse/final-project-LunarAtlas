// camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// ─── Camera Helpers ────────────────────────────────────────────────────────────
// Both cameras report state = { lat, lon, distance } for the HUD/labels, and
// expose update() to be called once per frame.

function watchResize(renderer, cam, W, H) {
  window.addEventListener('resize', () => {
    cam.aspect = W() / H();
    cam.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}

// Free-orbiting camera driven by mouse/touch (used to explore the moon).
export function createNavigatorCamera(renderer, W, H, subject, distance) {
  const cam = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);

  const subjectWorldPos = new THREE.Vector3();
  subject.getWorldPosition(subjectWorldPos);
  cam.position.copy(subjectWorldPos).add(new THREE.Vector3(0, 0, distance));
  cam.lookAt(subjectWorldPos);

  const controls = new OrbitControls(cam, renderer.domElement);
  controls.target.copy(subject.position);
  controls.enableDamping = true;
  controls.dampingFactor = 0.8;
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.8;
  controls.enablePan = false; // dragging should only orbit
  controls.minDistance = 20;
  controls.maxDistance = 50;

  const state = { lat: 0, lon: 0, distance };

  function update() {
    controls.update();

    const camWorldPos = new THREE.Vector3();
    const subjWorldPos = new THREE.Vector3();
    cam.getWorldPosition(camWorldPos);
    subject.getWorldPosition(subjWorldPos);

    const dir = camWorldPos.sub(subjWorldPos);
    state.distance = dir.length();
    dir.normalize();
    state.lat = Math.asin(dir.y);
    state.lon = Math.atan2(dir.x, dir.z);
  }

  watchResize(renderer, cam, W, H);
  return { cam, state, update };
}

// Fixed camera that stays locked behind a moving subject (e.g. the
// spacecraft), looking back at it with the moon's center beyond it.
export function createFollowerCamera(renderer, W, H, subject, distance) {
  const cam = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
  const state = { lat: 0, lon: 0, distance };

  function update() {
    const subjectWorldPos = new THREE.Vector3();
    subject.getWorldPosition(subjectWorldPos);

    // Direction from the moon's center (assumed at origin) out through the subject.
    const outward = subjectWorldPos.lengthSq() === 0
      ? new THREE.Vector3(0, 0, 1)
      : subjectWorldPos.clone().normalize();

    const camWorldPos = subjectWorldPos.clone().addScaledVector(outward, distance);

    if (cam.parent) {
      cam.parent.updateMatrixWorld(true);
      cam.position.copy(cam.parent.worldToLocal(camWorldPos));
    }

    cam.lookAt(subjectWorldPos);
  }

  watchResize(renderer, cam, W, H);
  return { cam, state, update };
}
