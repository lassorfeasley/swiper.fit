import React from "react";
import { Play, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { toast } from "@/lib/toastReplacement";
import ActionPill from "@/components/shared/ActionPill";

interface RoutineCardProps {
  id: string | number;
  name: string;
  lastCompleted?: string;
  routineData?: any;
  isFirstCard?: boolean;
  hideStart?: boolean;
  onCardClick?: (id: string | number) => void;
  onStartClick?: (routineData: any) => void;
  onSettingsClick?: (id: string | number) => void;
}

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
const RoutineCard = ({ id, name, lastCompleted, routineData, isFirstCard, hideStart, onCardClick, onStartClick, onSettingsClick }: RoutineCardProps) => {
  const navigate = useNavigate();
  const { startWorkout } = useActiveWorkout();

  const handleStartWorkout = async (e: React.MouseEvent) => {
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
        routine_exercises: (routineData.routine_exercises || []).map((re: any) => ({
          id: re.id,
          exercise_id: re.exercise_id,
          exercises: {
            name: re.exercises?.name,
            section: re.exercises?.section
          },
          routine_sets: (re.routine_sets || []).map((rs: any) => ({
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

      await startWorkout(formattedRoutine as any);
      navigate("/workout/active");
    } catch (error: any) {
      console.error("Failed to start workout:", error);
      toast.error("Failed to start workout: " + error.message);
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onSettingsClick) {
      onSettingsClick(id);
      return;
    }
    navigate(`/routines/${id}/configure`);
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(id);
    } else {
      navigate(`/routines/${id}/configure`);
    }
  };

  return (
    <div
      data-layer="Routine Card"
      className="RoutineCard w-full p-3 bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start gap-6 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
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
              onClick={() => handleSettingsClick({} as React.MouseEvent)}
              color="neutral"
              iconColor="neutral"
              showText={true}
            />
      </div>
    </div>
  );
};

export default RoutineCard;