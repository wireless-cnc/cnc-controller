/**
 * Three.js Scene Setup for CNC Visualization
 * Handles scene creation, lighting, camera, and rendering
 */

import * as THREE from "three";

export interface SceneConfig {
  canvasElement: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: number;
}

class SimpleOrbitControls {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  public target: THREE.Vector3 = new THREE.Vector3();
  public enableDamping = false;
  public dampingFactor = 0.05;
  public autoRotate = false;
  public enablePan = true;

  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();
  private scale = 1;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };

  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.addEventListener("wheel", this.onMouseWheel.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.previousMousePosition = { x: event.clientX, y: event.clientY };

    this.sphericalDelta.theta -= (deltaX / 300) * Math.PI;
    this.sphericalDelta.phi -= (deltaY / 300) * Math.PI;

    this.update();
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.scale += event.deltaY > 0 ? 0.1 : -0.1;
    this.scale = Math.max(0.1, this.scale);
    this.update();
  }

  public update(): void {
    const position = (this.camera as THREE.PerspectiveCamera).position;
    const offset = position.clone().sub(this.target);

    const radius = offset.length();

    this.spherical.setFromVector3(offset);
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.radius = radius / this.scale;

    this.sphericalDelta.theta = 0;
    this.sphericalDelta.phi = 0;
    this.scale = 1;

    offset.setFromSpherical(this.spherical);
    position.copy(this.target).add(offset);
    (this.camera as THREE.PerspectiveCamera).lookAt(this.target);
  }

  public dispose(): void {
    this.domElement.removeEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.removeEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.removeEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.removeEventListener("wheel", this.onMouseWheel.bind(this));
  }
}

export class CNCScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: SimpleOrbitControls | null = null;
  private animationId: number | null = null;

  constructor(config: SceneConfig) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.backgroundColor ?? 0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      config.width / config.height,
      0.1,
      10000
    );
    this.camera.position.set(100, 100, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvasElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    // Lighting
    this.setupLighting();

    // Grid
    this.setupGrid();

    // Orbit controls
    this.setupControls();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize(config));
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupGrid(): void {
    const gridSize = 500;
    const gridDivisions = 50;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    // Grid is on XZ plane (Y=0) which represents the CNC work surface (XY plane)
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    // Add axes helper
    // Red = X (CNC X), Green = Y (CNC Z - vertical), Blue = Z (CNC -Y)
    const axesHelper = new THREE.AxesHelper(100);
    this.scene.add(axesHelper);
  }

  private setupControls(): void {
    this.controls = new SimpleOrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = false;
    this.controls.enablePan = true;
  }

  private onWindowResize(config: SceneConfig): void {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getControls(): SimpleOrbitControls | null {
    return this.controls;
  }

  public fitCameraToObject(object: THREE.Object3D, padding = 1.2): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * padding;

    const center = box.getCenter(new THREE.Vector3());

    this.camera.position.copy(center);
    this.camera.position.z += distance;
    this.camera.lookAt(center);

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  public render(): void {
    if (this.controls) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  public animate(callback?: () => void): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      if (callback) callback();
      this.render();
    };
    animate();
  }

  public stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stopAnimation();
    window.removeEventListener("resize", () => this.onWindowResize);
    if (this.controls) {
      this.controls.dispose();
    }
    this.renderer.dispose();
  }
}
