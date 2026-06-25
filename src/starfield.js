// starfield.js
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function getStarfield({ numStars = 1000 } = {}) {
  function randomSpherePoint() {
    const radius = Math.random() * 500 + 1000;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.sin(phi) * Math.sin(theta);
    let z = radius * Math.cos(phi);
    const rate = Math.random() * 0.004;
    const prob = Math.random();
    const light = Math.random()+0.5;
    function update(t) {
      // refine me
      const lightness = prob > 0.9 ? light + Math.sin(t * rate) * 1 : light;
      return lightness;
    }
    return {
      pos: new THREE.Vector3(x, y, z),
      update,
      minDist: radius,
    };
  }
  const verts = [];
  const colors = [];
  const positions = [];
  let col;
  for (let i = 0; i < numStars; i += 1) {
    let p = randomSpherePoint();
    const { pos } = p;
    positions.push(p);
    col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    verts.push(pos.x, pos.y, pos.z);
    colors.push(col.r, col.g, col.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    map: new THREE.TextureLoader().load(
      "src/assets/circle.png"
    ),
  });

  const points = new THREE.Points(geo, mat);

  function update(t) {
    let col;
    const colors = [];
    for (let i = 0; i < numStars; i += 1) {
      const p = positions[i];
      const { update } = p;
      let bright = update(t);
      col = new THREE.Color().setHSL(0.6, 0.2, bright);
      colors.push(col.r, col.g, col.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.attributes.color.needsUpdate = true;
  }

  points.userData = { update };
  return points;
}

export function addEarthAndSun(scene) {
  // Moon radius from main.js is 10 units
  // Real Earth-Moon distance: ~384,400 km
  // Real Moon radius: 1,737 km, Real Earth radius: 6,371 km
  // Scale factor: 10 / 1,737 ≈ 0.00576 units/km
  // Scaled Earth-Moon distance: 384,400 * 0.00576 ≈ 2,214 units
  
  const moonRadius = 10;
  const earthMoonDistance = 240; // Scaled for visibility while maintaining realism
  const earthRadius = 6.371; // Scaled relative to moon (6,371/1,737 * 10)
  
  // Position Earth in the sky (at an angle from the moon)
  // Earth appears in the lunar sky at roughly this position
  const earthAngle = 0; // 54 degrees
  const earthElevation = 0; // 36 degrees above equator
  
  const earth_x = earthMoonDistance * Math.cos(earthElevation) * Math.cos(earthAngle);
  const earth_y = earthMoonDistance * Math.sin(earthElevation);
  const earth_z = earthMoonDistance * Math.cos(earthElevation) * Math.sin(earthAngle);
  
  // Create Earth with texture
  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('./src/assets/earth_texture.jpg');
  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTexture,
    emissive: 0x1a3a52,
    shininess: 30,
    side: THREE.FrontSide,
  });
  
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earth.position.set(earth_x, earth_y, earth_z);
  earth.userData.isEarth = true;
  earth.userData.name = 'Earth';
  scene.add(earth);
  
  // Add cloud layer to Earth
  const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.02, 64, 64);
  const cloudMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    shininess: 10,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.position.copy(earth.position);
  scene.add(clouds);
  
  // Add slight glow to Earth atmosphere
  const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.08, 32, 32);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  atmosphere.position.copy(earth.position);
  scene.add(atmosphere);
  
  // Sun positioning - approximately 150 million km away (400x Earth-Moon distance)
  const sunDistance = earthMoonDistance * 300;
  
  // Sun is roughly opposite to Earth from the Moon during certain times
  // Position at angle to create realistic lighting
  const sunAngle = Math.PI * 1.1;
  const sunElevation = Math.PI * 0.15;
  
  const sun_x = sunDistance * Math.cos(sunElevation) * Math.cos(sunAngle);
  const sun_y = sunDistance * Math.sin(sunElevation);
  const sun_z = sunDistance * Math.cos(sunElevation) * Math.sin(sunAngle);
  
  // Create Sun
  const sunGeo = new THREE.SphereGeometry(20, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfdb813,
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(sun_x, sun_y, sun_z);
  sun.userData.isSun = true;
  sun.userData.name = 'Sun';
  scene.add(sun);
  
  // Add sun glow/corona
  const sunGlowGeo = new THREE.SphereGeometry(40, 16, 16);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfdb813,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
  });
  const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);
  
  // Rotate Earth continuously
  function animateEarth() {
    if (earth) {
      earth.rotation.y += 0.0001;
    }
    if (clouds) {
      clouds.rotation.y += 0.0002;
    }
    requestAnimationFrame(animateEarth);
  }
  animateEarth();
}
