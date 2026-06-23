// camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera {
  constructor(renderer, W, H, subject, distance, fixed) {
    this.renderer = renderer;
    this.W = W;
    this.H = H;
    this.subject = subject;
    this.distance = distance;
    this.fixed = fixed;

    // Camera State
    this.state = { lat: 0, lon: 0, distance: distance };

    // Initialize Camera
    this.cam = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 2000);

    // Camera Control
    if(!fixed){
      const subjectWorldPos = new THREE.Vector3();
      const subjectWorldQuat = new THREE.Quaternion();
      this.subject.getWorldPosition(subjectWorldPos);
      this.subject.getWorldQuaternion(subjectWorldQuat);
      this.cam.position.copy(subjectWorldPos.clone().add(new THREE.Vector3(0, 0, this.distance)));
      this.cam.lookAt(subjectWorldPos);
      this.prevSubjectWorldPos = subjectWorldPos.clone();
      this.prevSubjectWorldQuat = subjectWorldQuat.clone();
      this.subjectDelta = new THREE.Vector3();
      this.rotationDelta = new THREE.Quaternion();
      this.inversePrevSubjectQuat = new THREE.Quaternion();
      this.cameraOffset = new THREE.Vector3();
      this.targetOffset = new THREE.Vector3();

      this.controls = new OrbitControls(this.cam, renderer.domElement);
      this.controls.target.copy(subjectWorldPos);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.8;
      this.controls.rotateSpeed = 0.4;
      this.controls.zoomSpeed = 0.8;
      this.controls.enablePan = false; // dragging should only orbit
      this.controls.minDistance = 12;
      this.controls.maxDistance = 40;
    }

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  updatePosition() {
    if (!this.fixed && this.controls) {
      const subjectWorldPos = new THREE.Vector3();
      const subjectWorldQuat = new THREE.Quaternion();
      this.subject.getWorldPosition(subjectWorldPos);
      this.subject.getWorldQuaternion(subjectWorldQuat);

      this.subjectDelta.subVectors(subjectWorldPos, this.prevSubjectWorldPos);
      this.inversePrevSubjectQuat.copy(this.prevSubjectWorldQuat).invert();
      this.rotationDelta.copy(subjectWorldQuat).multiply(this.inversePrevSubjectQuat);

      this.cameraOffset.copy(this.cam.position).sub(this.prevSubjectWorldPos).applyQuaternion(this.rotationDelta);
      this.cam.position.copy(subjectWorldPos).add(this.cameraOffset);

      this.targetOffset.copy(this.controls.target).sub(this.prevSubjectWorldPos).applyQuaternion(this.rotationDelta);
      this.controls.target.copy(subjectWorldPos).add(this.targetOffset);

      this.prevSubjectWorldPos.copy(subjectWorldPos);
      this.prevSubjectWorldQuat.copy(subjectWorldQuat);
      this.controls.update();
      this.camPosition();
      return;
    }

    const subjectWorldPos = new THREE.Vector3();
    this.subject.getWorldPosition(subjectWorldPos);

    // Direction from the parent body center (moon for spacecraft, world origin fallback)
    // out through the subject.
    const parentCenter = new THREE.Vector3();
    if (this.subject.parent) {
      this.subject.parent.getWorldPosition(parentCenter);
    } else {
      parentCenter.set(0, 0, 0);
    }

    const outward = subjectWorldPos.clone().sub(parentCenter);
    if (outward.lengthSq() === 0) {
      outward.set(0, 0, 1);
    } else {
      outward.normalize();
    }
    const camWorldPos = subjectWorldPos.clone().addScaledVector(outward, this.distance);

    if (this.cam.parent) {
      this.cam.parent.updateMatrixWorld(true);
      this.cam.position.copy(this.cam.parent.worldToLocal(camWorldPos.clone()));
    } 
    
    this.cam.lookAt(subjectWorldPos);
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
    this.state.distance = offset.length();
    const dir = offset.normalize();
    this.state.lat = Math.asin(dir.y);
    this.state.lon = Math.atan2(dir.x, dir.z);
  }
}