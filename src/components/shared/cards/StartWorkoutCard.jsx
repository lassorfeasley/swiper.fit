import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { toast } from "@/lib/toastReplacement";

/**
 * RoutineStartCard – streamlined card for starting workouts quickly.
 * Tapping anywhere on the card starts the workout.
 *
 * Props:
 *  • id – routine identifier.
 *  • name – routine name.
 *  • lastCompleted – last completion date text.
 *  • routineData – full routine data object for starting workouts.
 */
const StartWorkoutCard = ({ 
  id, 
  name, 
  lastCompleted, 
  routineData, 
  reorderable,
  reorderValue,
  isDragging,
  isFirstCard,
  onCardClick, // Custom click handler for sharing context
  ...props 
}) => {
  const navigate = useNavigate();
  const { startWorkout } = useActiveWorkout();

  const handleCardClick = async () => {
    // If custom onClick provided (e.g., from sharing context), use it instead
    if (onCardClick) {
      onCardClick();
      return;
    }

    if (!routineData) {
      toast.error("Routine data not available");
      return;
    }

    try {
      // Format the routine data to match what startWorkout expects
      const formattedRoutine = {
        id: routineData.id,
        routine_name: routineData.routine_name,
        routine_exercises: (routineData.routine_exercises || []).map((re) => ({
          id: re.id,
          exercise_id: re.exercise_id,
          exercises: {
            name: re.exercises?.name,
            section: re.exercises?.section
          },
          routine_sets: (re.routine_sets || []).map((rs) => ({
            id: rs.id,
            reps: rs.reps,
            weight: rs.weight,
            weight_unit: rs.weight_unit,
            set_order: rs.set_order,
            set_variant: rs.set_variant,
            set_type: rs.set_type,
            timed_set_duration: rs.timed_set_duration,
          }))
        }))
      };

      await startWorkout(formattedRoutine);
      navigate("/workout/active");
    } catch (error) {
      console.error("Failed to start workout:", error);
      toast.error("Failed to start workout: " + error.message);
    }
  };

  return (
    <div
      data-layer="card-wrapper"
      data-property-1="full-bleed"
      className="CardWrapper w-full min-h-14 bg-neutral-50 rounded-lg shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] border border-neutral-300 backdrop-blur-[1px] flex justify-start items-center gap-4 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
      {...props}
    >
      <div 
        data-layer="workout-card" 
        className="WorkoutCard flex-1 p-3 inline-flex flex-col justify-start items-start gap-10"
      >
        <div data-layer="routine-label" className="RoutineLabel self-stretch flex flex-col justify-start items-start gap-1">
          <div 
            data-layer="Back, triceps, and biceps" 
            className="BackTricepsAndBiceps self-stretch justify-center text-neutral-800 text-lg font-medium font-['Be_Vietnam_Pro'] leading-5"
          >
            {name}
          </div>
          {lastCompleted && (
            <div 
              data-layer="Last completed 3 days ago" 
              className="LastCompleted3DaysAgo self-stretch justify-center text-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3"
            >
              {lastCompleted}
            </div>
          )}
        </div>
        <div 
          data-layer="action-pill" 
          data-property-1="text" 
          data-show-text="true" 
          className="ActionPill h-10 min-w-24 px-4 py-3 bg-green-600 rounded-full shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex justify-center items-center gap-0.5"
        >
          <div data-layer="text" className="Text justify-center text-white text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">Start workout</div>
        </div>
      </div>
    </div>
  );
};

StartWorkoutCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  lastCompleted: PropTypes.string,
  routineData: PropTypes.object.isRequired,
  reorderable: PropTypes.bool,
  reorderValue: PropTypes.any,
  isDragging: PropTypes.bool,
  isFirstCard: PropTypes.bool,
  onCardClick: PropTypes.func, // Custom click handler
};

export default StartWorkoutCard;
