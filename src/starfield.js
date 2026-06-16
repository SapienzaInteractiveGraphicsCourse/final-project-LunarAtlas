// starfield.js
import * as THREE from 'three';

export function buildStars(scene) {
  // Realistic star catalog with proper distribution and magnitudes
  const starCount = 8000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    // Uniform sphere distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 200 + Math.random() * 350;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Apparent magnitude distribution (brighter stars are rarer)
    // Simulated using power law
    const magnitude = Math.pow(Math.random(), 1.5) * 6; // 0-6 magnitude scale
    const brightness = Math.pow(10, -magnitude / 2.5); // Convert to linear brightness

    // Star color variation based on temperature (cooler = red, hotter = blue)
    // Rough temperature classification
    const temp = Math.random();
    let r_color, g_color, b_color;

    if (temp < 0.1) {
      // Red dwarfs (M class) - cooler stars, more common
      r_color = 1.0;
      g_color = 0.4 + Math.random() * 0.2;
      b_color = 0.3 + Math.random() * 0.15;
    } else if (temp < 0.35) {
      // Orange stars (K class)
      r_color = 1.0;
      g_color = 0.65 + Math.random() * 0.15;
      b_color = 0.35 + Math.random() * 0.15;
    } else if (temp < 0.7) {
      // Yellow/White stars (G/F class, like our Sun)
      r_color = 1.0;
      g_color = 0.9 + Math.random() * 0.1;
      b_color = 0.7 + Math.random() * 0.15;
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
    sizes[i] = Math.max(0.3, brightness * 1.8 + Math.random() * 0.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    fog: false,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Add planets visible from near Earth/Moon
  addPlanets(scene);
}

function addPlanets(scene) {
  // Planets' approximate positions relative to Earth's orbital plane
  // Scaled for visibility in our scene
  const planets = [
    {
      name: 'Mercury',
      distance: 50,
      angle: 0.2,
      size: 0.4,
      color: 0x888888,
    },
    {
      name: 'Venus',
      distance: 80,
      angle: 1.8,
      size: 0.8,
      color: 0xffd700,
    },
    {
      name: 'Mars',
      distance: 120,
      angle: 4.5,
      size: 0.5,
      color: 0xff6347,
    },
    {
      name: 'Jupiter',
      distance: 160,
      angle: 2.1,
      size: 2.0,
      color: 0xc88b3a,
    },
    {
      name: 'Saturn',
      distance: 190,
      angle: 5.2,
      size: 1.6,
      color: 0xf4a460,
    },
  ];

  planets.forEach((planet) => {
    const x = planet.distance * Math.cos(planet.angle);
    const y = planet.distance * Math.sin(planet.angle) * 0.3; // Slight elevation
    const z = planet.distance * Math.sin(planet.angle) * 0.9;

    // Create glow sphere for the planet
    const geo = new THREE.SphereGeometry(planet.size, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: planet.color,
      emissive: planet.color,
      emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData.isPlanet = true;
    mesh.userData.name = planet.name;
    scene.add(mesh);

    // Add a subtle glow layer
    const glowGeo = new THREE.SphereGeometry(planet.size * 1.3, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: planet.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(mesh.position);
    scene.add(glow);
  });

  // Add the Sun in the background (distant bright point)
  const sunGeo = new THREE.SphereGeometry(3, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffff99,
    emissive: 0xffff99,
    emissiveIntensity: 1.0,
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(250, 50, -150);
  sun.userData.isPlanet = true;
  sun.userData.name = 'Sun';
  scene.add(sun);

  // Sun glow
  const sunGlowGeo = new THREE.SphereGeometry(6, 16, 16);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffff99,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
  });
  const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);
}