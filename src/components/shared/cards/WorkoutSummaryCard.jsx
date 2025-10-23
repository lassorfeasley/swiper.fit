import React from "react";
import PropTypes from "prop-types";
import { Check } from "lucide-react";
import ExerciseCardBase from "./ExerciseCardBase";

// Workout summary card: same as routine card but non-reorderable and shows a check icon
const WorkoutSummaryCard = ({ exerciseName, sets, className = "", addTopBorder = false, style }) => {
  return (
    <ExerciseCardBase
      exerciseName={exerciseName}
      sets={sets}
      addTopBorder={addTopBorder}
      className={`Property1WorkoutSummary bg-white rounded-xl ${className}`}
      style={style}
      rightHeader={
        <div className="size-8 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-500" />
        </div>
      }
    />
  );
};

WorkoutSummaryCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  sets: PropTypes.array,
  className: PropTypes.string,
  addTopBorder: PropTypes.bool,
  style: PropTypes.object,
};

export default WorkoutSummaryCard;


