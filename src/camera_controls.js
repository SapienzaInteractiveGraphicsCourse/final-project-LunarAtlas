// controls.js
import * as THREE from 'three';

export class CameraControl {
  constructor(renderer, camera, W, H, moon_radius) {
    this.renderer = renderer;
    this.camera = camera;
    this.W = W;
    this.H = H;
    this.moon_radius = moon_radius;

    this.navigator = {
      lon: 0,
      lat: 0,
      altitude: 10,
      targetAltitude: 10,
      speed: 0.003,
      keys: {}
    };

    this.NAVIGATOR_MIN_ALTITUDE = 2;
    this.NAVIGATOR_MAX_ALTITUDE = 50;

    this.canvas = renderer.domElement;
    this.mouseLook = false;
    this.lastMX = 0;
    this.lastMY = 0;

    this._up = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();

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

    const zoomDelta = e.deltaY * 0.02;

    this.navigator.targetAltitude = Math.max(
      this.NAVIGATOR_MIN_ALTITUDE,
      Math.min(this.NAVIGATOR_MAX_ALTITUDE, this.navigator.targetAltitude + zoomDelta)
    );
  }

  onKeyDown(e) {
    this.navigator.keys[e.code] = true;
  }

  onKeyUp(e) {
    this.navigator.keys[e.code] = false;
  }

  onResize(apolloCamera) {
    this.camera.aspect = this.W() / this.H();
    this.camera.updateProjectionMatrix();
    if (apolloCamera) {
      apolloCamera.aspect = this.W() / this.H();
      apolloCamera.updateProjectionMatrix();
    }
    this.renderer.setSize(this.W(), this.H());
  }

  updateCamera() {
    // Smooth zoom (lerp)
    this.navigator.altitude = THREE.MathUtils.lerp(
      this.navigator.altitude,
      this.navigator.targetAltitude,
      0.05 // smoothing factor
    );

    //Change camera position
    this._up.set(
      Math.cos(this.navigator.lat) * Math.sin(this.navigator.lon),
      Math.sin(this.navigator.lat),
      Math.cos(this.navigator.lat) * Math.cos(this.navigator.lon)
    ).normalize();

    this._camPos.copy(this._up).multiplyScalar(this.moon_radius + this.navigator.altitude);
    this.camera.position.copy(this._camPos);
    this._lookTarget.copy(this._camPos).multiplyScalar(-1);
    this.camera.lookAt(this._lookTarget);
  }

  processWalk() {
    const k = this.navigator.keys;
    let fwd = 0;
    let strafe = 0;
    if (k['KeyW'] || k['ArrowUp']) fwd += 1;
    if (k['KeyS'] || k['ArrowDown']) fwd -= 1;
    if (k['KeyA'] || k['ArrowLeft']) strafe -= 1;
    if (k['KeyD'] || k['ArrowRight']) strafe += 1;
    if (fwd === 0 && strafe === 0) return;

    const spd = this.navigator.speed;
    this.navigator.lon += strafe * spd;
    this.navigator.lat += fwd * spd;

    // Clamp latitude to [-90°, 90°] in radians
    const HALF_PI = Math.PI / 2;
    this.navigator.lat = Math.max(-HALF_PI, Math.min(HALF_PI, this.navigator.lat));

    // Wrap longitude to (-180°, 180°] in radians
    const PI = Math.PI;
    this.navigator.lon = ((this.navigator.lon + PI) % (2 * PI) + (2 * PI)) % (2 * PI) - PI;
  }
}
