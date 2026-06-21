// camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera {
  constructor(renderer, W, H, subject, distance, fixed) {
    this.renderer = renderer;
    this.W = W;
    this.H = H;
    this.subject = subject;

    // Camera State
    this.navigator = { lat: 0, lon: 0, distance };

    // Initialize Camera
    this.cam = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);
    this.cam.position.set(
      Math.cos(this.navigator.lat) * Math.sin(this.navigator.lon),
      Math.sin(this.navigator.lat),
      Math.cos(this.navigator.lat) * Math.cos(this.navigator.lon)
    ).multiplyScalar(distance);
    this.cam.lookAt(subject.position);

    // Camera Control
    if(!fixed){
      this.controls = new OrbitControls(this.cam, renderer.domElement);
      this.controls.target.copy(this.subject.position);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.8;
      this.controls.rotateSpeed = 0.4;
      this.controls.zoomSpeed = 0.8;
      this.controls.enablePan = false; // dragging should only orbit
      this.controls.minDistance = 20;  // stay outside the moon's surface
      this.controls.maxDistance = 50;
    }

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  onResize() {
    this.cam.aspect = this.W() / this.H();
    this.cam.updateProjectionMatrix();
    this.renderer.setSize(this.W(), this.H());
  }

  camPosition() {
    const camWorldPos = new THREE.Vector3();
    const subjectWorldPos = new THREE.Vector3();
    this.cam.getWorldPosition(camWorldPos);
    this.subject.getWorldPosition(subjectWorldPos);

    const offset = camWorldPos.sub(subjectWorldPos);
    this.navigator.distance = offset.length();
    const dir = offset.normalize();
    this.navigator.lat = Math.asin(dir.y);
    this.navigator.lon = Math.atan2(dir.x, dir.z);
  }
}