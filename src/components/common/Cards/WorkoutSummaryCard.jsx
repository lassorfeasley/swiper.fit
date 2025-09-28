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
      className={`Property1WorkoutSummary bg-white rounded-xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] ${className}`}
      style={style}
      rightHeader={
        <div className="size-6 relative overflow-hidden flex items-center justify-center">
          <Check className="size-6 text-green-600" strokeWidth={4} />
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


