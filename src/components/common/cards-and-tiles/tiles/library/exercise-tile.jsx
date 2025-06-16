// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=239-5532&t=8685riP4HV63gUQi-4

import React from "react";
import PropTypes from "prop-types";
import "../../../../../styles/typography.css";
import MetricPill from "../../metric-pill";

/**
 * ExerciseTile - Tile component for displaying exercise details with editable metrics
 *
 * Props:
 * - exerciseName: string
 * - sets: number
 * - reps: number
 * - weight: number
 * - onMetricsChange: function (optional)
 * - className: string (optional)
 */
const ExerciseTile = ({
  exerciseName,
  sets = 0,
  reps = 0,
  weight = 0,
  onMetricsChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-between w-full p-4 bg-stone-50 rounded-lg ${className}`}
      data-component="ExerciseTile"
    >
      <span className="h2-head">{exerciseName}</span>

      <div className="flex items-center gap-2">
        <MetricPill
          value={sets}
          unit="SETS"
          onClick={() => onMetricsChange?.("sets", sets)}
        />
        <MetricPill
          value={reps}
          unit="REPS"
          onClick={() => onMetricsChange?.("reps", reps)}
        />
        <MetricPill
          value={weight}
          unit="LBS"
          onClick={() => onMetricsChange?.("weight", weight)}
        />
      </div>
    </div>
  );
};

ExerciseTile.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  sets: PropTypes.number,
  reps: PropTypes.number,
  weight: PropTypes.number,
  onMetricsChange: PropTypes.func,
  className: PropTypes.string,
};

export default ExerciseTile;
