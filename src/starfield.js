// starfield.js
import * as THREE from 'three';

export function buildStars(scene) {
  
  // Create realistic starfield very far away
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  // Distance from origin where stars are placed
  const starDistance = 800;

  for (let i = 0; i < starCount; i++) {
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
    size: 2.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1,
    fog: false,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Add celestial bodies
  addEarthAndSun(scene);
}

function addEarthAndSun(scene) {
  // Real Moon radius: 1,737 km, Real Earth radius: 6,371 km
  
  const earthMoonDistance = 240; // Scaled for visibility while maintaining realism
  const earthRadius = 6.371; // Scaled relative to moon (6,371/1,737 * 10)
  
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
  earth.position.set(0, 0, 0);
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
