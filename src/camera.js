// controls.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera {
  constructor(renderer, W, H, subject, distance) {
    this.renderer = renderer;
    this.subject = subject;
    this.W = W;
    this.H = H;

    this.cam = new THREE.PerspectiveCamera(45, this.W() / this.H(), 0.1, 1000);

    this.navigator = {
      lon: 0,
      lat: 0,
      distance: distance,
      target_distance: distance,
      speed: 0.003,
      keys: {}
    };

    // this.controls = new OrbitControls(this.cam, renderer.domElement);
    // this.controls.target.copy(this.subject.position);
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.08;
    // this.controls.rotateSpeed = 0.6;
    // this.controls.zoomSpeed = 0.8;
    // this.controls.panSpeed = 0.5;
    // this.controls.enablePan = false; // dragging should orbit, not pan

    this.NAVIGATOR_MIN_ALTITUDE = 20;
    this.NAVIGATOR_MAX_ALTITUDE = 50;

    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onResize = this.onResize.bind(this);

    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    this.updateCamera();
  }

  onWheel(e) {
    e.preventDefault();

    const zoomDelta = e.deltaY * 0.02;

    this.navigator.target_distance = Math.max(
      this.NAVIGATOR_MIN_ALTITUDE,
      Math.min(this.NAVIGATOR_MAX_ALTITUDE, this.navigator.target_distance + zoomDelta)
    );
  }

  onKeyDown(e) {
    this.navigator.keys[e.code] = true;
  }

  onKeyUp(e) {
    this.navigator.keys[e.code] = false;
  }

  onResize(apolloCamera) {
    this.cam.aspect = this.W() / this.H();
    this.cam.updateProjectionMatrix();
    if (apolloCamera) {
      apolloCamera.aspect = this.W() / this.H();
      apolloCamera.updateProjectionMatrix();
    }
    this.renderer.setSize(this.W(), this.H());
  }

  updateCamera() {
    // Smooth zoom (lerp)
    this.navigator.distance = THREE.MathUtils.lerp(
      this.navigator.distance,
      this.navigator.target_distance,
      0.05 // smoothing factor
    );

    //Change camera position
    this.cam.position.set(
      Math.cos(this.navigator.lat) * Math.sin(this.navigator.lon),
      Math.sin(this.navigator.lat),
      Math.cos(this.navigator.lat) * Math.cos(this.navigator.lon)
    ).normalize().multiplyScalar(this.navigator.distance);

    this.cam.lookAt(this.subject.position);
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
