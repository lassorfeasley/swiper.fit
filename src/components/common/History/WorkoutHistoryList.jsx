import React from "react";
import { useNavigate } from "react-router-dom";
import WorkoutCard from "@/components/common/Cards/WorkoutCard";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";

/**
 * WorkoutHistoryList
 * -------------------
 * Displays a simple list of all workouts in chronological order.
 *
 * Props:
 * - workouts: Array of workout objects containing at least `created_at` and `workout_name`.
 * - viewingOwn: Boolean indicating whether the user is viewing their own workouts.
 */
const WorkoutHistoryList = ({ workouts = [], viewingOwn = true }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col min-h-screen" data-component="WorkoutHistoryList">
      {/* Workouts list */}
      <div className="flex justify-center flex-1">
        <DeckWrapper
          gap={0}
          paddingTop={82}
          paddingBottom={80}
          maxWidth={500}
          minWidth={325}
          className="mt-0"
        >
          {workouts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No workouts logged</div>
          ) : (
            workouts.map((w) => {
              const workoutDate = new Date(w.created_at);
              const todayMidnight = new Date();
              todayMidnight.setHours(0, 0, 0, 0);
              const diffDays = Math.floor(
                (todayMidnight -
                  new Date(
                    workoutDate.getFullYear(),
                    workoutDate.getMonth(),
                    workoutDate.getDate()
                  )) /
                  86400000
              );
              const relativeLabel = diffDays === 0 ? "Today" : `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
              
              return (
                <CardWrapper key={w.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(
                        viewingOwn ? `/history/${w.id}` : `/history/public/workout/${w.id}`
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(
                          viewingOwn ? `/history/${w.id}` : `/history/public/workout/${w.id}`
                        );
                      }
                    }}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring w-full"
                  >
                    <WorkoutCard
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