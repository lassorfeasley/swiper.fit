import React from "react";
import { useNavigate } from "react-router-dom";
import CompletedWorkoutCard from "./CompletedWorkoutCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChartNoAxesCombined } from "lucide-react";

interface WorkoutHistoryListProps {
  workouts?: any[];
  viewingOwn?: boolean;
}

/**
 * WorkoutHistoryList
 * -------------------
 * Displays a simple list of all workouts in chronological order.
 *
 * Props:
 * - workouts: Array of workout objects containing at least `created_at` and `workout_name`.
 * - viewingOwn: Boolean indicating whether the user is viewing their own workouts.
 */
const WorkoutHistoryList = ({ workouts = [], viewingOwn = true }: WorkoutHistoryListProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col min-h-screen" data-component="WorkoutHistoryList">
      {/* Workouts list */}
      <div className="flex justify-center flex-1">
        <DeckWrapper
          gap={12}
          paddingBottom={80}
          maxWidth={500}
          className="mt-0"
        >
          {workouts.length === 0 ? (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="Log a workout to view analysis."
              description="To review your workout history, you need to create a routine and log a workout."
            />
          ) : (
            workouts.map((w) => {
              const workoutDate = new Date(w.created_at);
              const todayMidnight = new Date();
              todayMidnight.setHours(0, 0, 0, 0);
              const diffDays = Math.floor(
                (todayMidnight.getTime() -
                  new Date(
                    workoutDate.getFullYear(),
                    workoutDate.getMonth(),
                    workoutDate.getDate()
                  ).getTime()) /
                  86400000
              );
              const relativeLabel = diffDays === 0 ? "Today" : `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
              
              return (
                <CardWrapper key={w.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/history/workout/${w.id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/history/workout/${w.id}`);
                      }
                    }}
                    className="cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring w-full"
                  >
                    <CompletedWorkoutCard
                      name={w.workout_name || "Workout"}
                      subtitle={
                        w.routines?.routine_name || w.muscle_group || "Workout"
                      }
                      relativeLabel={relativeLabel}
                    />
                  </div>
                </CardWrapper>
              );
            })
          )}
        </DeckWrapper>
      </div>
    </div>
  );
};

export default WorkoutHistoryList; 