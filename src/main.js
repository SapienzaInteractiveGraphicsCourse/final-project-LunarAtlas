import * as THREE from 'three';
import { buildStars } from './starfield.js';
import { Controls } from './controls.js';

// ─── Scene Setup ─────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const W = () => window.innerWidth;
const H = () => window.innerHeight;
 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
 
const scene = new THREE.Scene();
 
const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.1, 1000);
camera.position.set(0, 0, 3.5);
 
// ─── Starfield ────────────────────────────────────────────────────────────────
buildStars(scene);
 
// function generateMoonColorMap(size = 2048) {
//   const c = document.createElement('canvas');
//   c.width = c.height = size;
//   const ctx = c.getContext('2d');
 
//   // Base lunar grey
//   const base = ctx.createRadialGradient(size*0.5, size*0.5, 0, size*0.5, size*0.5, size*0.6);
//   base.addColorStop(0,   '#d6d0c4');
//   base.addColorStop(0.5, '#b8b0a0');
//   base.addColorStop(1,   '#8a8070');
//   ctx.fillStyle = base;
//   ctx.fillRect(0, 0, size, size);
 
//   // ── Mare (dark basaltic plains) ──────────────────────────────────────────
//   const mares = [
//     { cx: 0.30, cy: 0.38, rx: 0.18, ry: 0.13, color: '#6e6458', alpha: 0.85 }, // Mare Imbrium
//     { cx: 0.55, cy: 0.42, rx: 0.12, ry: 0.09, color: '#726456', alpha: 0.80 }, // Mare Serenitatis
//     { cx: 0.62, cy: 0.56, rx: 0.10, ry: 0.08, color: '#6a5e54', alpha: 0.75 }, // Mare Tranquillitatis
//     { cx: 0.45, cy: 0.60, rx: 0.09, ry: 0.07, color: '#6c6050', alpha: 0.70 }, // Mare Nubium
//     { cx: 0.22, cy: 0.55, rx: 0.08, ry: 0.06, color: '#726458', alpha: 0.65 }, // Oceanus Procellarum
//     { cx: 0.68, cy: 0.40, rx: 0.07, ry: 0.05, color: '#706055', alpha: 0.60 }, // Mare Crisium
//     { cx: 0.50, cy: 0.30, rx: 0.06, ry: 0.05, color: '#6e6254', alpha: 0.55 }, // Mare Frigoris
//     { cx: 0.35, cy: 0.65, rx: 0.10, ry: 0.06, color: '#786860', alpha: 0.60 }, // extra dark region
//   ];
 
//   mares.forEach(m => {
//     ctx.save();
//     ctx.globalAlpha = m.alpha;
//     ctx.beginPath();
//     ctx.ellipse(m.cx*size, m.cy*size, m.rx*size, m.ry*size, Math.random()*0.5, 0, Math.PI*2);
//     const g = ctx.createRadialGradient(
//       m.cx*size, m.cy*size, 0,
//       m.cx*size, m.cy*size, Math.max(m.rx, m.ry)*size
//     );
//     g.addColorStop(0,   m.color);
//     g.addColorStop(0.7, m.color + 'cc');
//     g.addColorStop(1,   m.color + '00');
//     ctx.fillStyle = g;
//     ctx.fill();
//     ctx.restore();
//   });
 
//   // ── Craters ──────────────────────────────────────────────────────────────
//   const rng = mulberry32(42);
//   for (let i = 0; i < 260; i++) {
//     const cx = rng() * size;
//     const cy = rng() * size;
//     const r  = rng() * rng() * size * 0.055 + 2;
//     const depth = rng();
 
//     ctx.save();
//     ctx.globalAlpha = 0.25 + depth * 0.45;
 
//     // Outer bright rim
//     const rim = ctx.createRadialGradient(cx, cy, r*0.75, cx, cy, r*1.15);
//     rim.addColorStop(0, 'rgba(200,195,185,0)');
//     rim.addColorStop(0.6, 'rgba(215,210,200,0.6)');
//     rim.addColorStop(1, 'rgba(180,175,165,0)');
//     ctx.beginPath();
//     ctx.arc(cx, cy, r*1.15, 0, Math.PI*2);
//     ctx.fillStyle = rim;
//     ctx.fill();
 
//     // Dark interior
//     const interior = ctx.createRadialGradient(cx+r*0.15, cy+r*0.15, 0, cx, cy, r*0.85);
//     interior.addColorStop(0, `rgba(60,52,44,${0.3+depth*0.5})`);
//     interior.addColorStop(0.7, `rgba(80,72,62,${0.1+depth*0.3})`);
//     interior.addColorStop(1, 'rgba(80,72,62,0)');
//     ctx.beginPath();
//     ctx.arc(cx, cy, r*0.85, 0, Math.PI*2);
//     ctx.fillStyle = interior;
//     ctx.fill();
 
//     ctx.restore();
//   }
 
//   // ── Ray systems (Tycho-like bright streaks) ───────────────────────────────
//   const rayCenters = [
//     {cx: 0.48, cy: 0.78}, // Tycho
//     {cx: 0.78, cy: 0.28}, // Copernicus
//   ];
//   rayCenters.forEach(rc => {
//     for (let r = 0; r < 18; r++) {
//       const angle = (r / 18) * Math.PI * 2 + rng() * 0.3;
//       const len   = (0.08 + rng() * 0.18) * size;
//       const x1 = rc.cx * size;
//       const y1 = rc.cy * size;
//       const x2 = x1 + Math.cos(angle) * len;
//       const y2 = y1 + Math.sin(angle) * len;
//       ctx.save();
//       ctx.globalAlpha = 0.12 + rng() * 0.12;
//       ctx.strokeStyle = '#e8e0d0';
//       ctx.lineWidth = 1 + rng() * 2;
//       ctx.beginPath();
//       ctx.moveTo(x1, y1);
//       ctx.lineTo(x2, y2);
//       ctx.stroke();
//       ctx.restore();
//     }
//   });
 
//   // ── Fine noise overlay ────────────────────────────────────────────────────
//   const imgData = ctx.getImageData(0, 0, size, size);
//   const d = imgData.data;
//   const nRng = mulberry32(99);
//   for (let i = 0; i < d.length; i += 4) {
//     const n = (nRng() - 0.5) * 18;
//     d[i]   = Math.min(255, Math.max(0, d[i]   + n));
//     d[i+1] = Math.min(255, Math.max(0, d[i+1] + n * 0.95));
//     d[i+2] = Math.min(255, Math.max(0, d[i+2] + n * 0.88));
//   }
//   ctx.putImageData(imgData, 0, 0);
 
//   return new THREE.CanvasTexture(c);
// }
 
function generateMoonBumpMap(size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
 
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, size, size);
 
  const rng = mulberry32(7);
 
  // Craters as bumps
  for (let i = 0; i < 220; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const r  = rng() * rng() * size * 0.05 + 2;
 
    // Raised rim (bright)
    const rim = ctx.createRadialGradient(cx, cy, r*0.6, cx, cy, r*1.2);
    rim.addColorStop(0,   'rgba(128,128,128,0)');
    rim.addColorStop(0.65,'rgba(220,220,220,0.9)');
    rim.addColorStop(1,   'rgba(128,128,128,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r*1.2, 0, Math.PI*2);
    ctx.fillStyle = rim;
    ctx.fill();
 
    // Depressed center (dark)
    const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, r*0.7);
    center.addColorStop(0,   'rgba(30,30,30,0.85)');
    center.addColorStop(0.8, 'rgba(80,80,80,0.4)');
    center.addColorStop(1,   'rgba(128,128,128,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r*0.7, 0, Math.PI*2);
    ctx.fillStyle = center;
    ctx.fill();
  }
 
  // Noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;
  const nRng = mulberry32(33);
  for (let i = 0; i < d.length; i += 4) {
    const n = (nRng() - 0.5) * 30;
    d[i] = d[i+1] = d[i+2] = Math.min(255, Math.max(0, d[i] + n));
  }
  ctx.putImageData(imgData, 0, 0);
 
  return new THREE.CanvasTexture(c);
}
 
function generateMoonRoughnessMap(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // Mare areas are smoother (darker roughness)
  ctx.fillStyle = '#b0a090';
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(55);
  for (let i = 0; i < 80; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const r  = rng() * size * 0.15 + 10;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(60,50,40,0.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = g;
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}


 
// Simple seedable RNG (mulberry32)
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
 
// ─── Moon Mesh ────────────────────────────────────────────────────────────────
const moon_radius = 10;
const moonGeo = new THREE.SphereGeometry(moon_radius, 1024, 512);
const texLoader = new THREE.TextureLoader();
 
const colorMap = texLoader.load("./src/assets/lroc_color_16bit_srgb.png", tex => {
                  tex.encoding = THREE.sRGBEncoding;
                  tex.anisotropy = maxAniso;
                  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
                  tex.needsUpdate = true;
                  tex.minFilter = THREE.LinearMipMapLinearFilter;
                  tex.magFilter = THREE.LinearFilter;
                  tex.generateMipmaps = true;
                  tex.mipmapsBias = -1.0; 
                });

const disMap = texLoader.load("./src/assets/ldem_64.png", tex => {
                  tex.anisotropy = maxAniso;
                  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
                  tex.needsUpdate = true;
                  tex.minFilter = THREE.LinearMipMapLinearFilter;
                  tex.magFilter = THREE.LinearFilter;
                  tex.generateMipmaps = true;
                  tex.needsUpdate = true;
                });
const bumpMap = texLoader.load("./src/assets/ldem_64.png");


 
const moonMat = new THREE.MeshStandardMaterial({
  map:             colorMap,
  displacementMap: disMap,
  displacementScale: 0.05,
  bumpMap: bumpMap,
  bumpScale: 10,
  ///roughnessMap:    roughnessMap,
  //roughness:       1,
  metalness:       0.0
});
 
const moon = new THREE.Mesh(moonGeo, moonMat);
moon.castShadow    = true;
moon.receiveShadow = true;
scene.add(moon);

// loader.load(
//   './src/assets/moon.glb', // file inside public/models/

//   (gltf) => {
//         const model = gltf.scene;

//         scene.add(model)
//         // Center model
//         const box = new THREE.Box3().setFromObject(model);
//         const center = box.getCenter(new THREE.Vector3())
//         model.position.sub(center)
//         console.log('Model loaded');
//   },

//   (xhr) => {
//         console.log(
//             `${((xhr.loaded / xhr.total) * 100).toFixed(1)}% loaded`
//         );
//     },

//   (error) => {
//         console.error('Error loading model:', error);
//   }
// );

// ─── Crater Database (lat/lon in radians) ────────────────────────────────────
const CRATERS = [
  { name: "Tycho",           lat:  -43.3, lon:  -11.2 },
  { name: "Copernicus",      lat:   9.7,  lon:  -20.1 },
  { name: "Plato",           lat:   51.6, lon:   -9.4 },
  { name: "Clavius",         lat:  -58.4, lon:  -14.1 },
  { name: "Kepler",          lat:   8.1,  lon:  -38.0 },
  { name: "Aristarchus",     lat:   23.7, lon:  -47.4 },
  { name: "Eratosthenes",    lat:   14.5, lon:  -11.3 },
  { name: "Grimaldi",        lat:   -5.5, lon:  -68.3 },
  { name: "Schickard",       lat:  -44.4, lon:  -54.6 },
  { name: "Ptolemaeus",      lat:   -9.2, lon:   -1.8 },
  { name: "Alphonsus",       lat:  -13.4, lon:   -2.8 },
  { name: "Arzachel",        lat:  -18.2, lon:   -1.9 },
  { name: "Theophilus",      lat:  -11.4, lon:   26.4 },
  { name: "Langrenus",       lat:   -8.9, lon:   61.1 },
  { name: "Mare Imbrium",    lat:   32.8, lon:  -15.6 },
  { name: "Mare Tranquillitatis", lat: 8.5, lon: 31.4 },
  { name: "Mare Serenitatis",lat:   28.0, lon:   17.5 },
  { name: "Oceanus Procellarum", lat: 18.4, lon: -57.4 },
  { name: "Mare Crisium",    lat:   17.0, lon:   59.1 },
  { name: "Mare Nubium",     lat:  -21.3, lon:  -16.6 },
]

// Great-circle angular distance between two lat/lon points
function angularDist(lat1, lon1, lat2, lon2) {
  const dLat = lat2 - lat1, dLon = lon2 - lon1;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * Math.asin(Math.sqrt(a));
}

function getNearestCrater(lat, lon) {
  let best = null, bestDist = Infinity;
  for (const c of CRATERS) {
    const d = angularDist(lat, lon, c.latR, c.lonR);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  // Only show a name if within ~15° 
  return bestDist < 0.26 ? best : null;
}

const craterLabel = document.getElementById('crater-label');
const posLabel    = document.getElementById('pos-label');

// ─── Subtle Atmosphere Glow ───────────────────────────────────────────────────
const atmGeo = new THREE.SphereGeometry(1.025, 64, 64);
const atmMat = new THREE.MeshBasicMaterial({
  color: 0xaabbdd,
  transparent: true,
  opacity: 0.035,
  side: THREE.FrontSide,
  depthWrite: false,
});
scene.add(new THREE.Mesh(atmGeo, atmMat));
 
// ─── Lighting ─────────────────────────────────────────────────────────────────
// Ambient (deep space faint light)
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

 
// ─── Orbit Controls (manual implementation) ──────────────────────────────────

const ctrl = new Controls(renderer, camera, W, H, moon_radius);

document.getElementById('loading').classList.add('hidden');
ctrl.updateCamera();
 
//─── Animations ───────────────────────────────────────────────────────────────

function animate(){
  requestAnimationFrame(animate);
  ctrl.processWalk();
  ctrl.updateCamera();
  renderer.render(scene,camera);

  // Update location HUD
  const latDeg = (ctrl.walker.lat * 180 / Math.PI).toFixed(2);
  const lonDeg = (ctrl.walker.lon * 180 / Math.PI).toFixed(2);
  const ns = latDeg >= 0 ? 'N' : 'S';
  const ew = lonDeg >= 0 ? 'E' : 'W';
  posLabel.textContent = `${Math.abs(latDeg)}° ${ns}  ${Math.abs(lonDeg)}° ${ew}`;

  const crater = getNearestCrater(ctrl.walker.lat, ctrl.walker.lon);
  craterLabel.textContent  = crater ? crater.name : '—';
  craterLabel.style.opacity = crater ? '1' : '0.3';
}
animate();