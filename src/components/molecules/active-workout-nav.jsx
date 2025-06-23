import React from "react";
import {
  PlayCircle,
  ChevronRightCircle,
  PauseCircle,
  StopCircle,
  Circle,
  Undo2,
} from "lucide-react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useNavigate } from "react-router-dom";
import { cn, formatSeconds } from "@/lib/utils";

export default function ActiveWorkoutNav() {
  const navigate = useNavigate();
  const {
    elapsedTime,
    isPaused,
    togglePause,
    isWorkoutActive,
    endWorkout: contextEndWorkout,
  } = useActiveWorkout();

  const handleC2AClick = () => {
    navigate("/workout");
  };

  const handleEndWorkout = async () => {
    try {
      await contextEndWorkout();
      navigate("/history");
    } catch (error) {
      console.error("Error ending workout:", error);
      alert("There was an error ending your workout. Please try again.");
    }
  };

  const handleReturnToWorkout = () => {
    navigate("/workout/active");
  };

  let workoutNavState = "c2a";
  if (isWorkoutActive) {
    if (location.pathname === "/workout/active") {
      workoutNavState = "activeWorkout";
    } else {
      workoutNavState = "returnToWorkout";
    }
  } else if (location.pathname === "/workout") {
    workoutNavState = "programPrompt";
  }

  const isBetween =
    workoutNavState === "activeWorkout" ||
    workoutNavState === "returnToWorkout";

  const baseContainerClasses =
    "h-12 px-3 py-2 bg-white rounded-lg shadow-[0px_0px_11.3px_0px_rgba(163,163,163,0.5)] inline-flex items-center overflow-hidden w-full cursor-pointer";

  const renderContent = () => {
    switch (workoutNavState) {
      case "c2a":
        return (
          <div
            className={cn(baseContainerClasses, "justify-start gap-2")}
            onClick={handleC2AClick}
          >
            <PlayCircle className="size-7 text-red-400" />
            <span className="text-neutral-700 text-sm font-medium leading-none">
              Record a workout
            </span>
          </div>
        );
      case "programPrompt":
        return (
          <div className={cn(baseContainerClasses, "justify-start gap-2")}>
            <ChevronRightCircle className="size-7 text-orange-600" />
            <span className="text-neutral-700 text-sm font-medium leading-none">
              Select a program
            </span>
          </div>
        );
      case "returnToWorkout":
        return (
          <div
            className={cn(baseContainerClasses, "justify-between")}
            onClick={handleReturnToWorkout}
          >
            <div className="flex-1 flex justify-start items-center gap-1">
              <Undo2 className="size-5 text-green-600" />
              <span className="text-neutral-700 text-sm font-medium leading-none">
                Return to workout
              </span>
            </div>
          </div>
        );
      case "activeWorkout":
        return (
          <div className={cn(baseContainerClasses, "justify-between")}>
            <div className="flex justify-start items-center gap-1">
              <Circle className="size-4 text-green-500 fill-current" />
              <span className="text-neutral-700 text-sm font-medium leading-none">
                {formatSeconds(elapsedTime)}
              </span>
            </div>
            <div className="flex justify-start items-center gap-2">
              {isPaused ? (
                <PlayCircle
                  className="size-7 text-orange-500"
                  onClick={togglePause}
                />
              ) : (
                <PauseCircle
                  className="size-7 text-orange-500"
                  onClick={togglePause}
                />
              )}
              <StopCircle
                className="size-7 text-red-400"
                onClick={handleEndWorkout}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
}
