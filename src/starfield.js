// starfield.js
import * as THREE from 'three';

export function buildStars(scene) {
  const geo = new THREE.BufferGeometry();
  const count = 6000;
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 200 + Math.random() * 300;

    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);

    sizes[i]   = Math.random() * 1.5 + 0.3;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
}