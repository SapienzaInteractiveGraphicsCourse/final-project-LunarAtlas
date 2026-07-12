// createMoon.js
import * as THREE from 'three';

export function createMoon(renderer, moon_radius) {
  const moonGeo = new THREE.SphereGeometry(moon_radius, 512, 256);
  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const colorMap = texLoader.load(
    new URL('./assets/lroc_color_16bit_srgb.jpg', import.meta.url).href, 
    tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.mipmapsBias = -1.0;
      tex.needsUpdate = true;
    }
  );

  const disMap = texLoader.load(
    new URL('./assets/ldem_64_resized.png', import.meta.url).href,
    tex => {
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    }
  );

  const bumpMap = texLoader.load(
    new URL('./assets/ldem_64_resized.png', import.meta.url).href,
    tex => {
      tex.anisotropy = maxAniso;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
    }
  );

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
    const atmGeo = new THREE.SphereGeometry(moon_radius+0.1, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0xaabbdd,
      transparent: true,
      opacity: 0.025,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    return new THREE.Mesh(atmGeo, atmMat);
}
