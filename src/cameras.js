// camera.js
import * as THREE from 'three';

const subjectWorldPos = new THREE.Vector3();
const cameraWorldPos = new THREE.Vector3();
const offset = new THREE.Vector3();

export function positionCamera(camera, subject, position) {
  subject.getWorldPosition(subjectWorldPos);
  camera.position.copy(subjectWorldPos).add(position);
  camera.lookAt(subjectWorldPos);

  const camera_position = {
    subject,
    ...cartesianToLatLon(position),
    distance: position.length(),

    updateLatLon() {
      camera.getWorldPosition(cameraWorldPos);
      subject.getWorldPosition(subjectWorldPos);

      offset.subVectors(cameraWorldPos, subjectWorldPos);
      this.distance = offset.length();
      offset.normalize();
      this.lat = Math.asin(Math.max(-1, Math.min(1, offset.y)));
      this.lon = Math.atan2(offset.x, offset.z);

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
