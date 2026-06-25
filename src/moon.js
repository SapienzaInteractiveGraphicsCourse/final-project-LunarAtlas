// createMoon.js
import * as THREE from 'three';

export function createMoon(renderer, moon_radius) {
  const moonGeo = new THREE.SphereGeometry(moon_radius, 512, 256);
  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const colorMap = texLoader.load("./src/assets/lroc_color_16bit_srgb.png", tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.mipmapsBias = -1.0;
    tex.needsUpdate = true;
  });

  const disMap = texLoader.load("./src/assets/ldem_64.png", tex => {
    tex.anisotropy = maxAniso;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
  });

  const bumpMap = texLoader.load("./src/assets/ldem_64.png", tex => {
    tex.anisotropy = maxAniso;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
  });

  const moonMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    displacementMap: disMap,
    displacementScale: 0.05,
    bumpMap: bumpMap,
    bumpScale: 5,
    roughness: 0.92,
    metalness: 0.0
  });

  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.rotation.y = -Math.PI / 2;

  return moon;
}

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
