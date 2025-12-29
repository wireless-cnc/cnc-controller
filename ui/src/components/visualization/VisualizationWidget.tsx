/**
 * Visualization Widget Wrapper
 * Integrates the 3D visualization into the app layout
 */

import React, { useState } from "react";
import { Visualization3D } from "./Visualization3D";
import { VisualizationControls } from "./VisualizationControls";
import "./VisualizationWidget.css";

export interface VisualizationWidgetProps {
  height?: number;
}

export const VisualizationWidget: React.FC<VisualizationWidgetProps> = ({
  height = 500,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRapids, setShowRapids] = useState(true);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    // Reset will be handled by the Visualization3D component
  };

  const handleToggleRapids = () => {
    setShowRapids(!showRapids);
  };

  return (
    <div className="visualization-widget">
      <div className="visualization-title">
        <h5>Toolpath Visualization</h5>
      </div>
      <div className="visualization-content">
        <Visualization3D height={height} />
        <VisualizationControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          onToggleRapids={handleToggleRapids}
          showRapids={showRapids}
        />
      </div>
    </div>
  );
};
