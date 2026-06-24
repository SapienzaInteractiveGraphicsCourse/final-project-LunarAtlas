// camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const _subjectWorldPos = new THREE.Vector3();
const _cameraWorldPos = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _outward = new THREE.Vector3();
const _perp = new THREE.Vector3();

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
export function positionCamera(camera, subject, position) {
  subject.getWorldPosition(_subjectWorldPos);
  camera.position.copy(_subjectWorldPos).add(position);
  camera.lookAt(_subjectWorldPos);

  const current_position = { ...cartesianToLatLon(position), distance: position.length() };

  return current_position;
}

export function updateLatLon(camera, subject, current_position){
  camera.getWorldPosition(_cameraWorldPos);
  subject.getWorldPosition(_subjectWorldPos);

  _offset.subVectors(_cameraWorldPos, _subjectWorldPos);
  current_position.distance = _offset.length();
  _offset.normalize();
  current_position.lat = Math.asin(Math.max(-1, Math.min(1, _offset.y)));
  current_position.lon = Math.atan2(_offset.x, _offset.z);
  
  return current_position;
}

function cartesianToLatLon(v) {
    const x = v.x;
    const y = v.y;
    const z = v.z;

    const lon = Math.atan2(x, z);                 // -π to +π
    const lat = Math.atan2(y, Math.sqrt(x*x + z*z)); // -π/2 to +π/2

    return { lat, lon };
}

// Orbit-controllable camera that starts locked behind a moving subject
// (e.g. the spacecraft) at the given distance, with the moon's center
// beyond it — but unlike a fixed follower, the user can freely orbit
// around the subject. The camera always looks at the subject, and the
// orbit controls' target is re-centered on the subject every frame so it
// keeps tracking it as it moves, while preserving the user's current
// orbit offset (radius/angles).
export function createSatelliteCamera(renderer, W, H, subject, distance, moonRadius) {
  const cam = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);

  const bounds = new THREE.Box3().setFromObject(subject);
  const sphere = new THREE.Sphere();
  bounds.getBoundingSphere(sphere);

  const minDistance = Math.max(sphere.radius * 0.6, 0.15);
  const minOutwardOffset = Math.max(moonRadius * 0.005, 0.08);

  // Direction from the moon's center (assumed at origin) out through the subject.
  subject.getWorldPosition(_subjectWorldPos);
  const outward = _subjectWorldPos.lengthSq() === 0
    ? new THREE.Vector3(0, 0, 1)
    : _subjectWorldPos.clone().normalize();

  cam.position.copy(_subjectWorldPos).addScaledVector(outward, Math.max(distance, minDistance));
  cam.lookAt(_subjectWorldPos);

  const controls = new OrbitControls(cam, renderer.domElement);
  controls.target.copy(_subjectWorldPos);
  controls.enableDamping = true;
  controls.dampingFactor = 0.8;
  controls.rotateSpeed = 0.4;
  controls.zoomSpeed = 0.8;
  controls.enablePan = false; // dragging should only orbit
  controls.minDistance = minDistance;
  controls.maxDistance = 12;

  const state = { lat: 0, lon: 0, distance };

  function enforceSafeOrbit(subjWorldPos) {
    cam.getWorldPosition(_cameraWorldPos);
    _offset.subVectors(_cameraWorldPos, subjWorldPos);

    _outward.copy(subjWorldPos).normalize();
    if (_outward.lengthSq() === 0) {
      _outward.set(0, 0, 1);
    }

    if (_offset.lengthSq() === 0) {
      _offset.copy(_outward).multiplyScalar(minDistance);
    }

    const outwardDistance = _offset.dot(_outward);
    _perp.copy(_offset).addScaledVector(_outward, -outwardDistance);
    const perpLength = _perp.length();

    let safeOutwardDistance = Math.max(outwardDistance, minOutwardOffset);
    const minOutwardForDistance = Math.sqrt(Math.max((minDistance * minDistance) - (perpLength * perpLength), 0));
    if (minOutwardForDistance > safeOutwardDistance) {
      safeOutwardDistance = minOutwardForDistance;
    }

    _offset.copy(_perp).addScaledVector(_outward, safeOutwardDistance);
    cam.position.copy(subjWorldPos).add(_offset);
    cam.lookAt(subjWorldPos);
  }

  function update() {
    subject.getWorldPosition(_subjectWorldPos);

    // Re-center the orbit target on the (possibly moving) subject before
    // updating, so the camera keeps its user-controlled orbit offset
    // relative to the subject's new position.
    controls.target.copy(_subjectWorldPos);
    controls.update();

    // Guarantee the camera is always looking directly at the subject,
    // even between damping steps.
    enforceSafeOrbit(_subjectWorldPos);

    cam.getWorldPosition(_cameraWorldPos);

    _offset.subVectors(_cameraWorldPos, _subjectWorldPos);
    state.distance = _offset.length();
    _offset.normalize();
    state.lat = Math.asin(Math.max(-1, Math.min(1, _offset.y)));
    state.lon = Math.atan2(_offset.x, _offset.z);
  }

  watchResize(renderer, cam, W, H);
  return {
    cam,
    state,
    update,
    setEnabled(enabled) {
      controls.enabled = enabled;
    }
  };
}