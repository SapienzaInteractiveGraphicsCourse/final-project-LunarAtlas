// createMoon.js
import * as THREE from 'three';

export function createMoon(renderer, moon_radius) {
//   const moon_radius = 10;
  const moonGeo = new THREE.SphereGeometry(moon_radius, 512, 256);
  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const colorMap = texLoader.load("./src/assets/lroc_color_16bit_srgb.png", tex => {
    tex.encoding = THREE.sRGBEncoding;
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

  const bumpMap = texLoader.load("./src/assets/ldem_64.png");

  const moonMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    displacementMap: disMap,
    displacementScale: 0.05,
    bumpMap: bumpMap,
    bumpScale: 10,
    metalness: 0.0
  });

  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.rotation.y = -Math.PI / 2;

  return moon;
}