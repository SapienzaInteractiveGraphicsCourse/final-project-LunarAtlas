import * as THREE from 'three';

export function setupLighting(scene){
    scene.add(new THREE.AmbientLight(0xffffff, 1));
     
    // Main sunlight (directional)
    const sun = new THREE.DirectionalLight(0xfff5e8, 2.2);
    sun.position.set(5, 2, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
     
    // Subtle earthshine (blue-ish fill from opposite side)
    const earthshine = new THREE.DirectionalLight(0x4466aa, 0.12);
    earthshine.position.set(-4, -1, -2);
    scene.add(earthshine);
}