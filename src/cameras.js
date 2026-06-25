// camera.js
import * as THREE from 'three';

const _subjectWorldPos = new THREE.Vector3();
const _cameraWorldPos = new THREE.Vector3();
const _offset = new THREE.Vector3();

export function positionCamera(camera, subject, position) {
  subject.getWorldPosition(_subjectWorldPos);
  camera.position.copy(_subjectWorldPos).add(position);
  camera.lookAt(_subjectWorldPos);

  const camera_position = {
    subject,
    ...cartesianToLatLon(position),
    distance: position.length(),

    updateLatLon() {
      camera.getWorldPosition(_cameraWorldPos);
      subject.getWorldPosition(_subjectWorldPos);

      _offset.subVectors(_cameraWorldPos, _subjectWorldPos);
      this.distance = _offset.length();
      _offset.normalize();
      this.lat = Math.asin(Math.max(-1, Math.min(1, _offset.y)));
      this.lon = Math.atan2(_offset.x, _offset.z);

      return this;
    }
  };

  return camera_position;
}

function cartesianToLatLon(v) {
  const x = v.x;
  const y = v.y;
  const z = v.z;

  const lon = Math.atan2(x, z);
  const lat = Math.atan2(y, Math.sqrt(x * x + z * z));

  return { lat, lon };
}
