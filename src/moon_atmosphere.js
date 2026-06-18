import * as THREE from 'three';

export function createMoonAtmoshpere(moon_radius){
    const atmGeo = new THREE.SphereGeometry(moon_radius+0.2, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0xaabbdd,
      transparent: true,
      opacity: 0.035,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    return new THREE.Mesh(atmGeo, atmMat);
}