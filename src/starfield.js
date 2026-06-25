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

export function getStarfield({ numStars = 1000 } = {}) {
  function randomSpherePoint() {
    const radius = Math.random() * 500 + 1000;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    const rate = Math.random() * 0.004;
    const prob = Math.random();
    const light = Math.random() + 0.5;

    return {
      pos: new THREE.Vector3(x, y, z),
      update(t) {
        return prob > 0.9 ? light + Math.sin(t * rate) : light;
      },
    };
  }

  const verts = [];
  const colors = [];
  const positions = [];

  for (let i = 0; i < numStars; i += 1) {
    const star = randomSpherePoint();
    positions.push(star);
    verts.push(star.pos.x, star.pos.y, star.pos.z);

    const color = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    colors.push(color.r, color.g, color.b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    map: new THREE.TextureLoader().load('src/assets/circle.png'),
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);

  function update(t) {
    const nextColors = [];

    for (let i = 0; i < numStars; i += 1) {
      const bright = positions[i].update(t);
      const color = new THREE.Color().setHSL(0.6, 0.2, bright);
      nextColors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(nextColors, 3));
    geo.attributes.color.needsUpdate = true;
  }

  points.userData = { update };
  return points;
}

export function addEarthAndSun(scene, moonRadius = 10) {
  const earthMoonDistance = 240;
  const earthRadius = moonRadius * 0.37;
  const earthPosition = EARTH_DIRECTION.clone().multiplyScalar(earthMoonDistance);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('./src/assets/earth_texture.jpg');
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      emissive: 0x020810,
      emissiveIntensity: 0.35,
      roughness: 0.65,
      metalness: 0,
    })
  );
  earth.position.copy(earthPosition);
  earth.userData.isEarth = true;
  earth.userData.name = 'Earth';
  scene.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.02, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.24,
      roughness: 0.9,
      depthWrite: false,
    })
  );
  clouds.position.copy(earth.position);
  scene.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.08, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  atmosphere.position.copy(earth.position);
  scene.add(atmosphere);

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

  function animateEarth() {
    earth.rotation.y += 0.0001;
    clouds.rotation.y += 0.0002;
    requestAnimationFrame(animateEarth);
  }
  animateEarth();

  return { earth, clouds, atmosphere, sun };
}
