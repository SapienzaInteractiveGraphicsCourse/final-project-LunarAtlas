import * as THREE from 'three';
import { FEATURES } from './features_database.js';

const _labelVec = new THREE.Vector3();

function angularDist(lat1, lon1, lat2, lon2) {
  const toR = Math.PI / 180;
  const la1 = lat1 * toR, lo1 = lon1 * toR, la2 = lat2 * toR, lo2 = lon2 * toR;
  const dLat = la2 - la1, dLon = lo2 - lo1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(a));
}

export function createLabelOverlay(moon_radius) {
  const labelContainer = document.getElementById('label-container');

  const featureData = FEATURES.map(f => {
    const latR = f.lat * Math.PI / 180;
    const lonR = f.lon * Math.PI / 180;

    const worldPos = new THREE.Vector3(
      moon_radius * Math.cos(latR) * Math.sin(lonR),
      moon_radius * Math.sin(latR),
      moon_radius * Math.cos(latR) * Math.cos(lonR)
    );

    const el = document.createElement('div');
    el.className = `moon-label moon-label--${f.type}`;
    el.innerHTML = `<span class="moon-label__dot"></span><span class="moon-label__text">${f.name}</span>`;
    labelContainer.appendChild(el);

    return { ...f, worldPos, el };
  });

  function update(activeCamera, camera) {
    const camDir = new THREE.Vector3();
    activeCamera.getWorldDirection(camDir);
    const w = window.innerWidth;
    const h = window.innerHeight;

    const alt = camera.state.distance;
    const scaleFactor = Math.max(0.6, Math.min(1.2, 20 / alt));

    for (const f of featureData) {
      const normal = f.worldPos.clone().normalize();
      const dot = normal.dot(camDir);

      if (dot > -0.08) {
        f.el.style.display = 'none';
        continue;
      }

      _labelVec.copy(f.worldPos);
      _labelVec.project(activeCamera);

      const sx = (_labelVec.x * 0.5 + 0.5) * w;
      const sy = (-_labelVec.y * 0.5 + 0.5) * h;

      if (sx < 0 || sx > w || sy < 0 || sy > h) {
        f.el.style.display = 'none';
        continue;
      }

      const opacity = Math.min(1, (Math.abs(dot) - 0.08) / 0.17);

      f.el.style.display = 'flex';
      f.el.style.transform = `translate(${sx}px, ${sy}px) scale(${scaleFactor})`;
      f.el.style.opacity = opacity.toFixed(3);
    }
  }

  function getNearestCrater(lat, lon) {
    const latD = lat * 180 / Math.PI;
    const lonD = lon * 180 / Math.PI;
    let best = null;
    let bestDist = Infinity;

    for (const f of FEATURES) {
      const d = angularDist(latD, lonD, f.lat, f.lon);
      if (d < bestDist) {
        bestDist = d;
        best = f;
      }
    }

    return bestDist < 15 ? best : null;
  }

  return { update, getNearestCrater };
}
