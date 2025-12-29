/**
 * CNC Toolpath Visualization Component
 * React component for 3D visualization of G-code paths
 */

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { JobStateSelectors } from "../../store";
import { GCodeParser } from "./GCodeParser";
import { CNCScene } from "./SceneSetup";
import { PathRenderer } from "./PathRenderer";
import * as THREE from "three";
import "./Visualization3D.css";

export interface Visualization3DProps {
  height?: number;
}

export const Visualization3D: React.FC<Visualization3DProps> = ({
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CNCScene | null>(null);
  const rendererRef = useRef<PathRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  // Redux selectors
  const jobLines = useSelector(JobStateSelectors.jobLines);
  const jobStatus = useSelector(JobStateSelectors.jobStatus);
  const linesProcessed = useSelector(JobStateSelectors.linesProcessed);

  // Initialize scene on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.parentElement?.getBoundingClientRect();
    const width = rect?.width || 800;

    // Initialize Three.js scene
    const scene = new CNCScene({
      canvasElement: canvasRef.current,
      width,
      height,
      backgroundColor: 0x1a1a1a,
    });

    sceneRef.current = scene;
    rendererRef.current = new PathRenderer();

    // Start animation loop
    scene.animate();

    // Cleanup
    return () => {
      scene.dispose();
    };
  }, [height]);

  // Re-render G-code when jobLines changes
  useEffect(() => {
    if (sceneRef.current && jobLines.length > 0) {
      // Clear previous visualization
      const scene = sceneRef.current.getScene();
      scene.children.forEach((child) => {
        if (child.type === 'Group' || child.userData.isWorkpiece) {
          scene.remove(child);
        }
      });

      renderGCode(sceneRef.current, jobLines);
    }
  }, [jobLines]);

  // Update tool position based on job progress
  useEffect(() => {
    if (sceneRef.current && rendererRef.current && jobLines.length > 0) {
      const parser = new GCodeParser();
      const parsed = parser.parse(jobLines);

      if (linesProcessed > 0 && linesProcessed <= parsed.segments.length) {
        const segment = parsed.segments[linesProcessed - 1];
        rendererRef.current.updateToolPosition(segment.end);
        setCurrentSegmentIndex(linesProcessed - 1);
      }
    }
  }, [linesProcessed, jobLines]);

  const renderGCode = (scene: CNCScene, gcode: string[]) => {
    try {
      // Parse G-code
      const parser = new GCodeParser();
      const parsed = parser.parse(gcode);

      // Create renderer
      const renderer = new PathRenderer({
        rapidColor: 0x888888,
        linearColor: 0x00ff00,
        arcColor: 0x0099ff,
        toolPositionColor: 0xff0000,
      });

      rendererRef.current = renderer;

      // Render all segments
      renderer.renderSegments(parsed.segments);
      scene.getScene().add(renderer.getGroup());

      // Fit camera to view all geometry
      scene.fitCameraToObject(renderer.getGroup(), 1.5);

      setIsLoaded(true);
    } catch (error) {
      console.error("Error rendering G-code:", error);
    }
  };

  const handleReset = () => {
    if (sceneRef.current && rendererRef.current) {
      setCurrentSegmentIndex(0);
      const parser = new GCodeParser();
      const parsed = parser.parse(jobLines);
      if (parsed.segments.length > 0) {
        rendererRef.current.updateToolPosition(parsed.segments[0].start);
      }
    }
  };

  return (
    <div className="visualization-container">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: `${height}px`,
          display: "block",
          borderRadius: "4px",
        }}
      />
      <div className="visualization-overlay">
        {!isLoaded && jobLines.length === 0 && (
          <div className="visualization-placeholder">
            Load a G-code file to visualize the toolpath
          </div>
        )}
        {isLoaded && (
          <div className="visualization-stats">
            <div className="stat-item">
              <span className="stat-label">Segments:</span>
              <span className="stat-value">{currentSegmentIndex}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status:</span>
              <span className="stat-value">{jobStatus}</span>
            </div>
            {jobStatus === "In progress" && (
              <button className="reset-button" onClick={handleReset}>
                Reset View
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
