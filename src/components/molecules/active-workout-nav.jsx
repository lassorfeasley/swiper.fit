import React from "react";
import {
  PlayCircle,
  ChevronRightCircle,
  PauseCircle,
  StopCircle,
  Circle,
  Undo2,
  Search,
  Settings2,
  Plus,
  Square,
} from "lucide-react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useNavigate } from "react-router-dom";
import { cn, formatSeconds } from "@/lib/utils";

export default function ActiveWorkoutNav({ completedSets = 0, totalSets = 1, onEnd, onSettings, onAdd }) {
  const { activeWorkout, elapsedTime } = useActiveWorkout();
  const progress = totalSets > 0 ? Math.min(completedSets / totalSets, 1) : 0;
  const formattedTime = formatSeconds(elapsedTime);
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white z-50">
      {/* Progress bar */}
      <div className="h-2 w-full flex overflow-hidden">
        <div
          className="bg-green-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progress * 100}%` }}
        />
        <div className="flex-1 bg-neutral-300" />
      </div>
      {/* Nav controls */}
      <div className="h-12 w-full flex justify-between items-center overflow-hidden">
        <div className="flex-1 self-stretch flex justify-start items-center">
          <div className="flex-1 h-12 pl-3 pr-3 inline-flex flex-col justify-center items-start">
            <div className="justify-center text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
              {activeWorkout?.workoutName || 'Workout'}
            </div>
            <div className="justify-center text-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              {activeWorkout?.routineName || ''}
            </div>
          </div>
          <div className="self-stretch flex justify-start items-center">
            <div className="w-12 h-12 border-l border-neutral-300 flex justify-center items-center gap-2.5">
              <Square className="w-6 h-6 text-neutral-500 cursor-pointer" onClick={onEnd} />
            </div>
          </div>
          <div className="h-12 flex justify-start items-center">
            <div className="w-12 h-12 border-l border-neutral-300 flex justify-center items-center gap-2.5">
              <Settings2 className="w-6 h-6 text-neutral-500 cursor-pointer" onClick={onSettings} />
            </div>
          </div>
          <div className="self-stretch flex justify-start items-center">
            <div className="w-12 h-12 border-l border-neutral-300 flex justify-center items-center gap-2.5">
              <Plus className="w-6 h-6 text-neutral-500 cursor-pointer" onClick={onAdd} />
            </div>
          </div>
          <div className="self-stretch flex justify-start items-center">
            <div className="h-12 pl-2 pr-3 border-l border-neutral-300 flex items-center gap-2.5">
              <Circle className="w-3 h-3 text-green-600 fill-current" />
              <div className="text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">
                {formattedTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
