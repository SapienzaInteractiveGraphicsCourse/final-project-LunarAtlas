import * as THREE from 'three';
import { EARTH_DIRECTION, SUN_DIRECTION } from './lighting.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Spacecraft {
    constructor(glbPath, orbitRadius) {
        this.glbPath = glbPath;
        this.model = null;
        this.isLoaded = false;
        this.loader = new GLTFLoader();
        this.orbitLon = 0;
        this.orbitLat = 0;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = 0.0001;
        this.loadPromise = this.load();
    }

    async load() {
        try {
            const gltf = await this.loader.loadAsync(this.glbPath);
            this.model = gltf.scene;
            this.model.scale.set(0.005, 0.005, 0.005);
            this.isLoaded = true;
            return this.model;
        } catch (err) {
            console.error('Error loading GLB:', err);
            throw err;
        }
    }

    getModelPart(part_name) {
        if (!this.isLoaded) {
            throw new Error('Spacecraft model not loaded. Call load() first.');
        }
        return this.model.getObjectByName(part_name);
    }

    setPosition(x, y, z) {
        if (!this.isLoaded) {
            throw new Error('Spacecraft model not loaded. Call load() first.');
        }
        this.model.position.set(x, y, z);
    }

    setPositionFromVector(position) {
        if (!this.isLoaded) {
            throw new Error('Spacecraft model not loaded. Call load() first.');
        }
        this.model.position.copy(position);
    }

    updateOrbitAnimation() {
        if (!this.isLoaded) {
            throw new Error('Spacecraft model not loaded. Call load() first.');
        }

        this.orbitLon += this.orbitSpeed;

        const x = this.orbitRadius * Math.cos(this.orbitLat) * Math.cos(this.orbitLon);
        const y = this.orbitRadius * Math.sin(this.orbitLat);
        const z = this.orbitRadius * Math.cos(this.orbitLat) * Math.sin(this.orbitLon);

        this.model.position.set(x, y, z);
        this.model.lookAt(0, 0, 0);
        this.model.rotateY(-Math.PI/2);
        this.model.rotateX(-Math.PI/6);
    }


    setOrbitParameters(radius, speed, lat = 0) {
        this.orbitRadius = radius;
        this.orbitSpeed = speed;
        this.orbitLat = lat;
    }
}

export function solarPanelsAnimation(spacecraft_solar_panels){
    const panelWorldPos = new THREE.Vector3();
    spacecraft_solar_panels.getWorldPosition(panelWorldPos);
    const sunPosition = panelWorldPos.clone().add(SUN_DIRECTION.clone());
    const offset = new THREE.Vector3(4.7, -0.28, 0.36);
    spacecraft_solar_panels.lookAt(sunPosition.add(offset));
}

export function createBigArmsKeyboardAnimation(spacecraftModel, rotationSpeed = 1.2) {
    if (!spacecraftModel) throw new Error('Spacecraft model is required.');
    const getJoint = (n) => spacecraftModel.getObjectByName(`Big_Arm_${n}`);
    const joints = [getJoint(1), getJoint(2), getJoint(3), getJoint(4),  getJoint(5)];
    if (joints.some((joint) => !joint)) throw new Error('Big Arm 1, 2, 3 not found in gateway_core.glb.');

    const keyMap = [
        { plus: 'q', minus: 'a', joint: joints[0] },
        { plus: 'w', minus: 's', joint: joints[1] },
        { plus: 'e', minus: 'd', joint: joints[2] },
        { plus: 'r', minus: 'f', joint: joints[3] },
        { plus: 't', minus: 'g', joint: joints[4] }
    ];
    const pressed = new Set();
    const clock = new THREE.Clock();

    window.addEventListener('keydown', (event) => pressed.add(event.key.toLowerCase()));
    window.addEventListener('keyup', (event) => pressed.delete(event.key.toLowerCase()));
    console.log('Big Arm controls: Q/A -> arm1, W/S -> arm2, E/D -> arm3, R/F -> arm4, T/G -> arm5');

    return {
        update() {
            const step = rotationSpeed * clock.getDelta();
            for (const { plus, minus, joint } of keyMap) {
                const dir = (pressed.has(plus) ? 1 : 0) - (pressed.has(minus) ? 1 : 0);
                const joint_number = parseInt(joint.name.replace("Big_Arm_", ""));
                if (dir !== 0) {
                    if ([1,2].includes(joint_number)) joint.rotation.y += dir * step;
                    else if ([3].includes(joint_number)) joint.rotation.z += dir * step;
                    else joint.rotation.x += dir * step;
                }
            }
        }
    };
}