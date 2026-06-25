import * as THREE from 'three';

// Directions are from the Moon toward the object in the sky.
export const SUN_DIRECTION = new THREE.Vector3(-0.36, 0.28, 0.89).normalize();
export const EARTH_DIRECTION = new THREE.Vector3(0.95, 0.18, -0.25).normalize();

export function setupLighting(scene, moonRadius = 10) {
  const lights = new THREE.Group();
  lights.name = 'Physical moon lighting';

  // Space has no ambient sky light. This tiny floor keeps unlit details barely readable.
  lights.add(new THREE.AmbientLight(0x05070c, 0.025));

  const sunlight = new THREE.DirectionalLight(0xfff4df, 4.8);
  sunlight.name = 'Sunlight';
  sunlight.position.copy(SUN_DIRECTION).multiplyScalar(800);
  sunlight.target.position.set(0, 0, 0);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(4096, 4096);
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 1400;
  sunlight.shadow.camera.left = -moonRadius * 3;
  sunlight.shadow.camera.right = moonRadius * 3;
  sunlight.shadow.camera.top = moonRadius * 3;
  sunlight.shadow.camera.bottom = -moonRadius * 3;
  sunlight.shadow.bias = -0.00003;
  sunlight.shadow.normalBias = 0.015;
  lights.add(sunlight);
  lights.add(sunlight.target);

  const earthshine = new THREE.DirectionalLight(0x8eb6ff, 0.055);
  earthshine.name = 'Earthshine';
  earthshine.position.copy(EARTH_DIRECTION).multiplyScalar(500);
  earthshine.target.position.set(0, 0, 0);
  lights.add(earthshine);
  lights.add(earthshine.target);

  scene.add(lights);
  return { sunlight, earthshine };
}
