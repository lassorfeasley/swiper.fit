import React from "react";
import { PlayCircle, ChevronRightCircle, PauseCircle, StopCircle, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";

// Props: state: 'c2a' | 'programPrompt' | 'workoutInProgress', variant: 'sidebar' | 'mobile', onClick: function
export default function ActiveWorkoutNav({ state = 'c2a', variant = 'sidebar', onClick }) {
  const { elapsedTime, isPaused, togglePause, endWorkout } = useActiveWorkout();

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Sidebar style: colored, rounded, full-width bar (no Card)
  if (variant === 'sidebar') {
    return (
      <div className="w-full">
        {state === 'c2a' && (
          <div
            className="w-full h-10 p-2 bg-red-500 rounded-sm backdrop-blur-[2px] flex items-center gap-2 cursor-pointer hover:bg-red-600 transition-colors"
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
          <div className="w-full h-10 p-2 bg-orange-500 rounded-sm backdrop-blur-[2px] flex items-center gap-2">
            <ChevronRightCircle className="Lucide size-6 text-white" />
            <span className="text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">Select a program</span>
          </div>
        )}
        {state === 'workoutInProgress' && (
          <div className="w-full p-2 bg-green-600 rounded-sm backdrop-blur-[2px] flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Circle className="Lucide size-6 text-white" fill="currentColor" />
              <span className="text-white text-sm font-normal font-['Space_Grotesk'] leading-tight">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label={isPaused ? "Resume" : "Pause"} onClick={togglePause}>
                <PauseCircle className={`Lucide size-6 ${isPaused ? 'opacity-50' : 'text-white'}`} />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Stop" onClick={endWorkout}>
                <StopCircle className="Lucide size-6 text-white" />
              </Button>
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
      {state === 'workoutInProgress' && (
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            <Circle className="Lucide size-6 text-green-600" fill="currentColor" />
            <span className="text-sm font-normal font-['Space_Grotesk'] leading-tight">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={isPaused ? "Resume" : "Pause"} onClick={togglePause}>
              <PauseCircle className={`Lucide size-6 ${isPaused ? 'opacity-50' : 'text-green-600'}`} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Stop" onClick={endWorkout}>
              <StopCircle className="Lucide size-6 text-green-600" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
} 