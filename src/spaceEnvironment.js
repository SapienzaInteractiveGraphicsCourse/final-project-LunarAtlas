// starfield.js
import * as THREE from 'three';
import { EARTH_DIRECTION, SUN_DIRECTION } from './lighting.js';


function makeSunTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.08, 'rgba(255,248,214,1)');
  gradient.addColorStop(0.16, 'rgba(255,211,96,0.95)');
  gradient.addColorStop(0.38, 'rgba(255,166,48,0.28)');
  gradient.addColorStop(1.0, 'rgba(255,120,20,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function getStarfield({numStars = 1000} = {}) {
  
  // Create realistic starfield very far away
  const positions = new Float32Array(numStars * 3);
  const colors = new Float32Array(numStars * 3);
  const sizes = new Float32Array(numStars);

  // Distance from origin where stars are placed
  const starDistance = 1000;

  for (let i = 0; i < numStars; i++) {
    // Uniform sphere distribution on a distant sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = starDistance * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = starDistance * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = starDistance * Math.cos(phi);

    // Apparent magnitude distribution (brighter stars are rarer)
    // Power law distribution favoring dimmer stars
    const magnitude = Math.pow(Math.random(), 2) * 6; // 0-6 magnitude scale
    const brightness = Math.pow(10, -magnitude / 2.5); // Convert to linear brightness

    // Star color variation based on temperature
    const temp = Math.random();
    let r_color, g_color, b_color;

    if (temp < 0.7) {
      // White stars (G/F class, like our Sun)
      r_color = 1;
      g_color = 1;
      b_color = 1;
    } else if (temp < 0.9) {
      // Blue-white stars (A class)
      r_color = 0.9 + Math.random() * 0.1;
      g_color = 0.95 + Math.random() * 0.05;
      b_color = 1.0;
    } else {
      // Blue giants (B/O class) - hotter but rarer
      r_color = 0.6 + Math.random() * 0.2;
      g_color = 0.8 + Math.random() * 0.15;
      b_color = 1.0;
    }

    colors[i * 3] = r_color;
    colors[i * 3 + 1] = g_color;
    colors[i * 3 + 2] = b_color;

    // Size based on magnitude (apparent brightness)
    sizes[i] = Math.max(0.1, brightness * 1.2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    size: 2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1,
    fog: false,
  });

  const stars = new THREE.Points(geo, mat);
  return stars;
}

export function addEarth(scene, moonRadius = 10) {
  const earthMoonDistance = 240;
  const earthRadius = moonRadius * 0.50;
  const earthPosition = EARTH_DIRECTION.clone().multiplyScalar(earthMoonDistance);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load(new URL('./assets/earth_texture.jpg', import.meta.url).href);
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      emissive: 0xffffff,
      emissiveMap: earthTexture,
      emissiveIntensity: 0.28,
      roughness: 0.5,
      metalness: 0,
    })
  );
  earth.position.copy(earthPosition);
  earth.userData.isEarth = true;
  earth.userData.name = 'Earth';
  scene.add(earth);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.08, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x3b8cff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  atmosphere.position.copy(earth.position);
  scene.add(atmosphere);

  const earthGlow = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.035, 48, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4aa8ff) },
        glowStrength: { value: 0.45 },
        glowPower: { value: 3.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float glowStrength;
        uniform float glowPower;
        varying vec3 vNormal;
        varying vec3 vViewDirection;

        void main() {
          float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), glowPower);
          gl_FragColor = vec4(glowColor, rim * glowStrength);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  );
  earthGlow.position.copy(earth.position);
  scene.add(earthGlow);
}

export function addSun(scene){
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSunTexture(),
    color: 0xfff1c0,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));

  sun.position.copy(SUN_DIRECTION).multiplyScalar(1300);
  sun.scale.setScalar(85);
  sun.userData.isSun = true;
  sun.userData.name = 'Sun';
  scene.add(sun);

  return sun;
}