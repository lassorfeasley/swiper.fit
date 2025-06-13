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
        {state === 'return-to-workout' && (
          <div 
            data-layer="Property 1=return-to-workout" 
            className="Property1ReturnToWorkout self-stretch p-2 bg-green-600 rounded-lg backdrop-blur-[2px] inline-flex justify-between items-start overflow-hidden cursor-pointer hover:bg-green-700 transition-colors"
            onClick={handleReturnToWorkout}
            role="button"
            tabIndex={0}
            aria-label="Return to active workout"
          >
            <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper flex-1 flex justify-between items-center">
              <div data-layer="icon-text-wrapper" className="IconTextWrapper flex-1 flex justify-start items-center gap-1">
                <div data-layer="lucide" className="Lucide size-6 relative overflow-hidden">
                  <ArrowRight className="size-4 text-white" />
                </div>
                <div data-layer="TimePassed" className="Timepassed justify-center text-white text-xs font-semibold font-['Space_Grotesk'] leading-none">
                  Return to workout
                </div>
              </div>
            </div>
          </div>
        )}
        {state === 'active-workout' && (
          <div 
            data-layer="ActiveWorkoutNav" 
            className="w-full h-24 px-6 py-3 bg-black/90 backdrop-blur-[2px] flex justify-center items-start"
          >
            <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper w-80 max-w-80 flex justify-between items-start">
              <div data-layer="Timer" className="Timer flex justify-start items-center gap-1">
                <div data-svg-wrapper data-layer="RecordingIcon" className="Recordingicon">
                  <Circle className="w-5 h-5 text-green-500" fill="currentColor" />
                </div>
                <div data-layer="TimePassed" className="Timepassed justify-center text-white text-xl font-normal font-['Space_Grotesk'] leading-loose">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              <div data-layer="NavIconsWrapper" className="Naviconswrapper flex justify-start items-center">
                <div 
                  data-layer="NavIcons" 
                  data-selected={!isPaused} 
                  className={`Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer${isPaused ? ' NaviconsSelected3 w-14' : ''}`}
                  onClick={togglePause}
                >
                  {isPaused ? (
                    <>
                      <div data-svg-wrapper data-layer="play" className="Play relative">
                        <Play className="w-7 h-7 text-white" />
                      </div>
                      <div data-layer="Resume" className="Resume text-center justify-start text-white text-xs font-bold font-['Space_Grotesk'] leading-3">Resume</div>
                    </>
                  ) : (
                    <>
                      <div data-svg-wrapper data-layer="pause" className="Pause relative">
                        <Pause className="w-7 h-7 text-slate-200" />
                      </div>
                      <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
                        Pause
                      </div>
                    </>
                  )}
                </div>
                <div 
                  data-layer="NavIcons" 
                  data-selected="true" 
                  className="Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer"
                  onClick={handleEnd}
                >
                  <div data-svg-wrapper data-layer="stop" className="Stop relative">
                    <Square className="w-7 h-7 text-slate-200" />
                  </div>
                  <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
                    End
                  </div>
                </div>
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
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            <Circle className="Lucide size-6 text-green-600" fill="currentColor" />
            <span className="text-sm font-normal font-['Space_Grotesk'] leading-tight">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={isPaused ? "Resume" : "Pause"} onClick={togglePause}>
              <PauseCircle className={`Lucide size-6 ${isPaused ? 'opacity-50' : 'text-green-600'}`} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Stop" onClick={handleEnd}>
              <StopCircle className="Lucide size-6 text-green-600" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
} 