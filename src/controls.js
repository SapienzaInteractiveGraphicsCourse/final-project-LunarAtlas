// controls.js
import * as THREE from 'three';

export class Controls {
  constructor(renderer, camera, W, H, moon_radius) {
    this.renderer = renderer;
    this.camera = camera;
    this.W = W;
    this.H = H;
    this.moon_radius = moon_radius;

    this.walker = {
      lon: 0.3,
      lat: 0.5,
      altitude: 10,
      speed: 0.003,
      keys: {}
    };

    this.WALKER_MIN_ALTITUDE = 0.3;
    this.WALKER_MAX_ALTITUDE = 50;

    this.canvas = renderer.domElement;
    this.mouseLook = false;
    this.lastMX = 0;
    this.lastMY = 0;

    this._up = new THREE.Vector3();
    this._east = new THREE.Vector3();
    this._north = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._worldUp = new THREE.Vector3(0, 1, 0);

    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onResize = this.onResize.bind(this);

    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
  }

  onWheel(e) {
    e.preventDefault();
    const step = e.deltaY * 0.02;
    this.walker.altitude = Math.max(
      this.WALKER_MIN_ALTITUDE,
      Math.min(this.WALKER_MAX_ALTITUDE, this.walker.altitude + step)
    );
  }

  onKeyDown(e) {
    this.walker.keys[e.code] = true;
  }

  onKeyUp(e) {
    this.walker.keys[e.code] = false;
  }

  onResize() {
    this.camera.aspect = this.W() / this.H();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.W(), this.H());
  }

  updateCamera() {
    this._up.set(
      Math.cos(this.walker.lat) * Math.sin(this.walker.lon),
      Math.sin(this.walker.lat),
      Math.cos(this.walker.lat) * Math.cos(this.walker.lon)
    ).normalize();

    this._camPos.copy(this._up).multiplyScalar(this.moon_radius + this.walker.altitude);
    this.camera.position.copy(this._camPos);
    this._lookTarget.copy(this._camPos).multiplyScalar(-1);
    this.camera.lookAt(this._lookTarget);
  }

  processWalk() {
    const k = this.walker.keys;
    let fwd = 0;
    let strafe = 0;
    if (k['KeyW'] || k['ArrowUp']) fwd += 1;
    if (k['KeyS'] || k['ArrowDown']) fwd -= 1;
    if (k['KeyA'] || k['ArrowLeft']) strafe -= 1;
    if (k['KeyD'] || k['ArrowRight']) strafe += 1;
    if (fwd === 0 && strafe === 0) return;

    const spd = this.walker.speed;
    this.walker.lon += strafe * spd;
    this.walker.lat += fwd * spd;
  }
}
