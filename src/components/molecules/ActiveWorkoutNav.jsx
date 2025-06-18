import React from "react";
import {
  PlayCircle,
  ChevronRightCircle,
  PauseCircle,
  StopCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/atoms/card";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function ActiveWorkoutNav({ variant = "sidebar" }) {
  const {
    elapsedTime,
    isPaused,
    togglePause,
    isWorkoutActive,
    endWorkout: contextEndWorkout,
  } = useActiveWorkout();
  const navigate = useNavigate();

  const handleC2AClick = () => {
    navigate("/workout");
  };

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
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

  const WORKOUT_NAV_STYLES = {
    c2a: {
      backgroundColor: "bg-red-500",
      textColor: "text-white",
    },
    programPrompt: {
      backgroundColor: "bg-orange-500",
      textColor: "text-white",
    },
    returnToWorkout: {
      backgroundColor: "bg-green-600",
      textColor: "text-white",
    },
    activeWorkout: {
      backgroundColor: "bg-green-600",
      textColor: "text-white",
    },
  };

  if (variant === "sidebar") {
    return (
      <div className="w-full cursor-pointer">
        {workoutNavState === "c2a" && (
          <div
            className="w-full h-12 p-3 bg-red-500 rounded-[8px] backdrop-blur-[2px] flex items-center gap-2 cursor-pointer hover:bg-red-600 transition-colors"
            onClick={handleC2AClick}
          >
            <PlayCircle className="Lucide size-6 text-white" />
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
              Record a workout
            </span>
          </div>
        )}
        {workoutNavState === "programPrompt" && (
          <div className="w-full h-12 p-3 bg-orange-500 rounded-[8px] backdrop-blur-[2px] flex items-center gap-2">
            <ChevronRightCircle className="Lucide size-6 text-white" />
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
              Select a program
            </span>
          </div>
        )}
        {workoutNavState === "returnToWorkout" && (
          <div
            className="w-full h-12 p-3 bg-green-600 rounded-[8px] backdrop-blur-[2px] flex items-center justify-start gap-2 overflow-hidden cursor-pointer hover:bg-green-700 transition-colors"
            onClick={handleReturnToWorkout}
          >
            <span className="flex items-center">
              <ArrowRight className="size-5 text-white" />
            </span>
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
              Return to workout
            </span>
          </div>
        )}
        {workoutNavState === "activeWorkout" && (
          <div className="w-full h-12 p-3 bg-green-600 rounded-[8px] backdrop-blur-[2px] flex items-center justify-between overflow-hidden">
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center h-6">
                  <Circle
                    className="size-3 text-stone-100"
                    fill="currentColor"
                  />
                </span>
                <div className="flex items-center text-white text-sm font-normal font-['Space_Grotesk'] leading-tight">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              <div
                data-layer="icons-wrapper"
                className="IconsWrapper flex items-center gap-2"
              >
                <button
                  className="size-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                  onClick={togglePause}
                  aria-label={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <PlayCircle className="size-8" />
                  ) : (
                    <PauseCircle className="size-8" />
                  )}
                </button>
                <button
                  className="size-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                  onClick={handleEndWorkout}
                  aria-label="End workout"
                >
                  <StopCircle className="size-8" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "w-full p-2 inline-flex flex-col justify-start items-start gap-5 overflow-hidden mb-2",
        WORKOUT_NAV_STYLES[workoutNavState].backgroundColor,
        WORKOUT_NAV_STYLES[workoutNavState].textColor
      )}
    >
      {workoutNavState === "c2a" && (
        <div
          className="flex items-center gap-2 p-2 rounded"
          onClick={handleC2AClick}
        >
          <PlayCircle className="Lucide size-6 text-white" />
          <span className="text-xs font-semibold font-['Space_Grotesk'] leading-none">
            Record a workout
          </span>
        </div>
      )}
      {workoutNavState === "programPrompt" && (
        <div className="flex items-center gap-2 p-2 rounded">
          <ChevronRightCircle className="Lucide size-6 text-white" />
          <span className="text-xs font-semibold font-['Space_Grotesk'] leading-none">
            Select a program
          </span>
        </div>
      )}
      {workoutNavState === "returnToWorkout" && (
        <div
          className="flex items-center gap-2 p-2 rounded"
          onClick={handleReturnToWorkout}
        >
          <ArrowRight className="size-4 text-white" />
          <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
            Return to workout
          </span>
        </div>
      )}
      {workoutNavState === "activeWorkout" && (
        <div className="flex justify-between items-center gap-2 p-2 rounded w-full">
          <div className="flex items-center gap-1">
            <Circle className="size-3 text-stone-100" fill="currentColor" />
            <span className="text-white text-sm font-normal font-['Space_Grotesk'] leading-tight">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="size-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
              onClick={togglePause}
              aria-label={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <PlayCircle className="size-8" />
              ) : (
                <PauseCircle className="size-8" />
              )}
            </button>
            <button
              className="size-8 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
              onClick={handleEndWorkout}
              aria-label="End workout"
            >
              <StopCircle className="size-8" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
