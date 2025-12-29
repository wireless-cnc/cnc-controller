/**
 * Path Renderer for CNC Visualization
 * Renders G-code paths as Three.js geometries
 */

import * as THREE from "three";
import { PathSegment, Position } from "./GCodeParser";

export interface PathRendererConfig {
  rapidColor?: number;
  linearColor?: number;
  arcColor?: number;
  toolPositionColor?: number;
  lineWidth?: number;
}

export class PathRenderer {
  private group: THREE.Group;
  private config: PathRendererConfig;
  private segmentsMesh: THREE.LineSegments | null = null;
  private toolPositionMesh: THREE.Mesh | null = null;

  constructor(config: PathRendererConfig = {}) {
    this.group = new THREE.Group();
    this.config = {
      rapidColor: 0x888888,
      linearColor: 0x00ff00,
      arcColor: 0x0099ff,
      toolPositionColor: 0xff0000,
      lineWidth: 2,
      ...config,
    };
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public clear(): void {
    // Remove all children
    for (let i = this.group.children.length - 1; i >= 0; i--) {
      this.group.remove(this.group.children[i]);
    }
    this.segmentsMesh = null;
    this.toolPositionMesh = null;
  }

  public renderSegments(segments: PathSegment[]): void {
    // Separate segments by type
    const rapidSegments: PathSegment[] = [];
    const linearSegments: PathSegment[] = [];
    const arcSegments: PathSegment[] = [];

    for (const segment of segments) {
      if (segment.type === "rapid") {
        rapidSegments.push(segment);
      } else if (segment.type === "linear") {
        linearSegments.push(segment);
      } else if (segment.type === "arc") {
        arcSegments.push(segment);
      }
    }

    // Render each type
    if (rapidSegments.length > 0) {
      this.renderSegmentGroup(rapidSegments, this.config.rapidColor!, "rapid");
    }
    if (linearSegments.length > 0) {
      this.renderSegmentGroup(linearSegments, this.config.linearColor!, "linear");
    }
    if (arcSegments.length > 0) {
      this.renderArcSegments(arcSegments);
    }
  }

  private renderSegmentGroup(
    segments: PathSegment[],
    color: number,
    type: string
  ): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    for (const segment of segments) {
      // Transform CNC coordinates (X, Y, Z) to Three.js (X, Z, -Y)
      // CNC: X=left-right, Y=front-back, Z=up-down
      // Three.js: X=left-right, Y=up-down, Z=front-back
      positions.push(
        segment.start.x,
        segment.start.z,
        -segment.start.y,
        segment.end.x,
        segment.end.z,
        -segment.end.y
      );
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));

    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: this.config.lineWidth,
      transparent: true,
      opacity: type === "rapid" ? 0.5 : 0.8,
      vertexColors: false,
    });

    const mesh = new THREE.LineSegments(geometry, material);
    this.group.add(mesh);

    // Add to cache if linear (main cutting path)
    if (type === "linear") {
      this.segmentsMesh = mesh;
    }
  }

  private renderArcSegments(segments: PathSegment[]): void {
    for (const segment of segments) {
      this.renderArc(segment);
    }
  }

  private renderArc(segment: PathSegment): void {
    if (!segment.center) return;

    const resolution = 32; // Points per arc
    const points: THREE.Vector3[] = [];

    // Transform CNC coordinates to Three.js coordinates
    const start = new THREE.Vector3(segment.start.x, segment.start.z, -segment.start.y);
    const end = new THREE.Vector3(segment.end.x, segment.end.z, -segment.end.y);
    const center = new THREE.Vector3(segment.center.x, segment.center.z, -segment.center.y);

    const startAngle = Math.atan2(
      start.z - center.z,
      start.x - center.x
    );
    const endAngle = Math.atan2(end.z - center.z, end.x - center.x);

    const radius = start.distanceTo(center);
    let angle = startAngle;
    const step = segment.clockwise ? -1 : 1;

    for (let i = 0; i <= resolution; i++) {
      const currentAngle = startAngle + (step * (endAngle - startAngle) * i) / resolution;
      const x = center.x + radius * Math.cos(currentAngle);
      const z = center.z + radius * Math.sin(currentAngle);
      const y = start.y + ((end.y - start.y) * i) / resolution; // Linear Y interpolation (vertical in Three.js)

      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.config.arcColor,
      linewidth: this.config.lineWidth,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Line(geometry, material);
    this.group.add(mesh);
  }

  public updateToolPosition(position: Position): void {
    // Remove old tool position indicator
    if (this.toolPositionMesh) {
      this.group.remove(this.toolPositionMesh);
      this.toolPositionMesh.geometry.dispose();
      (this.toolPositionMesh.material as THREE.Material).dispose();
    }

    // Create sphere for tool position
    const geometry = new THREE.SphereGeometry(2, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: this.config.toolPositionColor,
      emissive: this.config.toolPositionColor,
      emissiveIntensity: 0.5,
    });

    const sphere = new THREE.Mesh(geometry, material);
    // Transform CNC coordinates to Three.js coordinates
    sphere.position.set(position.x, position.z, -position.y);
    sphere.castShadow = true;

    this.group.add(sphere);
    this.toolPositionMesh = sphere;
  }

  public createToolRepresentation(toolDiameter: number = 5): THREE.Mesh {
    // Create a simple cylinder to represent the tool
    // Cylinder is oriented along Y-axis (vertical) in Three.js which matches CNC Z-axis
    const geometry = new THREE.CylinderGeometry(toolDiameter / 2, toolDiameter / 2, 10, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      emissive: 0x330000,
    });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;

    return cylinder;
  }

  public createWorkpiece(bounds: { min: Position; max: Position }, material?: THREE.Material): THREE.Mesh {
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.y - bounds.min.y; // CNC Y becomes Three.js Z
    const height = bounds.max.z - bounds.min.z; // CNC Z becomes Three.js Y

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const defaultMaterial = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      emissive: 0x444444,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material || defaultMaterial);

    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.z + bounds.max.z) / 2; // CNC Z
    const centerZ = -(bounds.min.y + bounds.max.y) / 2; // CNC Y (negated)

    mesh.position.set(centerX, centerY, centerZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  public highlightSegment(segmentIndex: number, color: number = 0xffff00): void {
    // Create a highlight overlay for a specific segment
    if (this.segmentsMesh) {
      const positions = this.segmentsMesh.geometry.getAttribute("position") as THREE.BufferAttribute;
      const colors = new Uint8Array(positions.count * 3);

      // Color all points with the highlight color
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;

      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = r;
        colors[i + 1] = g;
        colors[i + 2] = b;
      }

      this.segmentsMesh.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3, true)
      );
      (this.segmentsMesh.material as THREE.LineBasicMaterial).vertexColors = true;
    }
  }
}
