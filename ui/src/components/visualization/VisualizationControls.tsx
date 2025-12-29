/**
 * Visualization Controls Component
 * Provides playback and display controls for the 3D visualization
 */

import React from "react";
import { FaPlay, FaPause, FaRedo } from "react-icons/fa";
import "./VisualizationControls.css";

export interface VisualizationControlsProps {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onReset?: () => void;
  onToggleRapids?: () => void;
  showRapids?: boolean;
  currentSegment?: number;
  totalSegments?: number;
}

export const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  isPlaying = false,
  onPlayPause,
  onReset,
  onToggleRapids,
  showRapids = true,
  currentSegment = 0,
  totalSegments = 0,
}) => {
  return (
    <div className="visualization-controls">
      <div className="controls-group">
        <button
          className="control-button"
          onClick={onPlayPause}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button
          className="control-button"
          onClick={onReset}
          title="Reset"
        >
          <FaRedo />
        </button>
      </div>

      <div className="controls-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showRapids}
            onChange={onToggleRapids}
          />
          <span>Show Rapid Moves</span>
        </label>
      </div>

      <div className="controls-group info">
        <span className="info-text">
          {currentSegment} / {totalSegments} segments
        </span>
      </div>
    </div>
  );
};
