import * as THREE from 'three';
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
        this.orbitSpeed = 0.001;
        this.loadPromise = this.load();
    }

    async load() {
        try {
            const gltf = await this.loader.loadAsync(this.glbPath);
            this.model = gltf.scene;
            this.model.scale.set(0.005, 0.005, 0.005);
            this.model.rotation.z = -Math.PI / 2;
            this.isLoaded = true;
            return this.model;
        } catch (err) {
            console.error('Error loading GLB:', err);
            throw err;
        }
    }

    getModel() {
        if (!this.isLoaded) {
            throw new Error('Spacecraft model not loaded. Call load() first.');
        }
        return this.model;
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
        this.model.rotateZ(Math.PI / 2);
    }

    setOrbitParameters(radius, speed, lat = 0) {
        this.orbitRadius = radius;
        this.orbitSpeed = speed;
        this.orbitLat = lat;
    }
}