import React from "react";
import { PlayCircle, ChevronRightCircle, PauseCircle, StopCircle, Circle, Play, Pause, Square, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useNavigate } from "react-router-dom";

// Props: state: 'c2a' | 'programPrompt' | 'active-workout' | 'return-to-workout', variant: 'sidebar' | 'mobile', onClick: function
export default function ActiveWorkoutNav({ state = 'c2a', variant = 'sidebar', onClick, onEnd }) {
  const { elapsedTime, isPaused, togglePause, endWorkout: contextEndWorkout } = useActiveWorkout();
  const navigate = useNavigate();

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEnd = onEnd || contextEndWorkout;

  const handleReturnToWorkout = () => {
    navigate('/workout/active');
  };

  // Sidebar style: colored, rounded, full-width bar (no Card)
  if (variant === 'sidebar') {
    return (
      <div className="w-full">
        {state === 'c2a' && (
          <div
            className="w-full h-12 p-3 bg-red-500 rounded-[8px] backdrop-blur-[2px] flex items-center gap-2 cursor-pointer hover:bg-red-600 transition-colors"
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label="Record a workout"
          >
            <PlayCircle className="Lucide size-6 text-white" />
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">Record a workout</span>
          </div>
        )}
        {state === 'programPrompt' && (
          <div className="w-full h-12 p-3 bg-orange-500 rounded-[8px] backdrop-blur-[2px] flex items-center gap-2">
            <ChevronRightCircle className="Lucide size-6 text-white" />
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">Select a program</span>
          </div>
        )}
        {state === 'return-to-workout' && (
          <div 
            data-layer="Property 1=return-to-workout" 
            className="Property1ReturnToWorkout w-full h-12 p-3 bg-green-600 rounded-[8px] backdrop-blur-[2px] flex items-center justify-start gap-2 overflow-hidden cursor-pointer hover:bg-green-700 transition-colors"
            onClick={handleReturnToWorkout}
            role="button"
            tabIndex={0}
            aria-label="Return to active workout"
          >
            <span className="flex items-center">
              <ArrowRight className="size-5 text-white" />
            </span>
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
              Return to workout
            </span>
          </div>
        )}
        {state === 'active-workout' && (
          <div 
            data-layer="Property 1=active-workout" 
            className="Property1ActiveWorkout w-full h-12 p-3 bg-green-600 rounded-[8px] backdrop-blur-[2px] flex items-center justify-between overflow-hidden"
          >
            <div data-layer="max-width-wrapper" className="MaxWidthWrapper flex flex-1 items-center justify-between">
              <div data-layer="icon-timer-wrapper" className="IconTimerWrapper flex items-center gap-2">
                <span className="flex items-center h-6">
                  <Circle className="size-3 text-stone-100" fill="currentColor" />
                </span>
                <div data-layer="timer" className="Timer flex items-center text-white text-sm font-normal font-['Space_Grotesk'] leading-tight">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              <div data-layer="icons-wrapper" className="IconsWrapper flex items-center gap-2">
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
                  onClick={handleEnd}
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
  // Mobile style: Card (as before)
  return (
    <Card data-layer="ActiveWorkoutNav" className="Activeworkoutnav w-[513px] p-5 inline-flex flex-col justify-start items-start gap-5 overflow-hidden">
      {state === 'c2a' && (
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-red-100 p-2 rounded"
          onClick={onClick}
          tabIndex={0}
          role="button"
          aria-label="Record a workout"
        >
          <PlayCircle className="Lucide size-6 text-red-500" />
          <span className="text-xs font-semibold font-['Space_Grotesk'] leading-none">Record a workout</span>
        </div>
      )}
      {state === 'programPrompt' && (
        <div className="flex items-center gap-2">
          <ChevronRightCircle className="Lucide size-6 text-orange-500" />
          <span className="text-xs font-semibold font-['Space_Grotesk'] leading-none">Select a program</span>
        </div>
      )}
      {state === 'return-to-workout' && (
        <div 
          className="w-full p-2 bg-green-600 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-green-700 transition-colors"
          onClick={handleReturnToWorkout}
          role="button"
          tabIndex={0}
          aria-label="Return to active workout"
        >
          <ArrowRight className="size-4 text-white" />
          <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
            Return to workout
          </span>
        </div>
      )}
      {state === 'active-workout' && (
        <div 
          className="w-full p-2 bg-green-600 rounded-lg flex justify-between items-center"
        >
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
              onClick={handleEnd}
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