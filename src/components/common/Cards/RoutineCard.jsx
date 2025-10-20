import React from "react";
import PropTypes from "prop-types";
import { Play, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { toast } from "sonner";
import ActionPill from "@/components/molecules/action-pill";

/**
 * RoutineCard – card representation of a workout program with direct start and builder access.
 *
 * Props:
 *  • id – program identifier.
 *  • name – program name.
 *  • lastCompleted – last completion date text.
 *  • routineData – full routine data object for starting workouts.
 *  • isFirstCard – whether this is the first card (unused).
 */
const RoutineCard = ({ id, name, lastCompleted, routineData, isFirstCard, hideStart, onCardClick, onStartClick, onSettingsClick }) => {
  const navigate = useNavigate();
  const { startWorkout } = useActiveWorkout();

  const handleStartWorkout = async (e) => {
    e.stopPropagation(); // Prevent card click
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

  const handleSettingsClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onSettingsClick) {
      onSettingsClick(e);
      return;
    }
    navigate(`/routines/${id}/configure`);
  };

  const handleCardClick = () => {
    navigate(`/routines/${id}/configure`);
  };
  return (
    <div
      data-layer="Routine Card"
      className="RoutineCard w-full p-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-300 inline-flex flex-col justify-start items-start gap-6 overflow-hidden cursor-pointer"
      onClick={onCardClick || handleCardClick}
    >
      <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
        <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
          <div data-layer="Biceps and chest" className="BicepsAndChest justify-start text-gray-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {name}
          </div>
          {lastCompleted && (
            <div data-layer="Completed 5 days ago" className="Completed5DaysAgo text-center justify-center text-gray-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              {lastCompleted}
            </div>
          )}
        </div>
      </div>
      <div data-layer="Frame 5014" className="Frame5014 inline-flex justify-start items-start gap-2">
        <ActionPill
          label="Edit routine"
          Icon={Cog}
          onClick={handleSettingsClick}
          color="neutral"
          iconColor="neutral"
          showText={true}
          className="[&_.Text]:!text-neutral-700"
        />
      </div>
    </div>
  );
};

RoutineCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  lastCompleted: PropTypes.string,
  routineData: PropTypes.object,
  isFirstCard: PropTypes.bool,
  hideStart: PropTypes.bool,
  onCardClick: PropTypes.func,
  onStartClick: PropTypes.func,
  onSettingsClick: PropTypes.func,
};

export default RoutineCard; 
// gjkgfhjk
