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
    <div data-layer="ActiveWorkoutNav" className="fixed top-0 left-0 right-0 w-full h-11 self-stretch bg-neutral-200 border-b border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden z-50">
      <div data-layer="max-width-wrapper" className="MaxWidthWrapper self-stretch inline-flex justify-start items-center h-full">
        <div data-layer="icons-wrapper" className="IconsWrapper w-11 h-full border-r border-neutral-300 flex justify-center items-center">
          <div data-layer="Frame 23" className="Frame23 size-12 flex justify-center items-center gap-2.5">
            <Settings2 className="w-6 h-6 text-neutral-700" onClick={onSettings} />
          </div>
        </div>
        <div data-layer="Frame 22" className="Frame22 flex-1 h-10 pl-3 inline-flex flex-col justify-center items-start">
          <div data-layer="timeer" className="Timeer justify-center text-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {activeWorkout?.workoutName || 'Workout'}
          </div>
          <div data-layer="timeer" className="Timeer justify-center text-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
            {activeWorkout?.routineName || ''}
          </div>
        </div>
        <div data-layer="Frame 53" className="Frame53 self-stretch h-full border-l border-neutral-300 flex justify-start items-center gap-0.5">
          <div data-layer="icons-wrapper" className="IconsWrapper w-7 self-stretch flex justify-end items-center">
            <div data-layer="Frame 23" className="Frame23 flex-1 h-full flex justify-end items-center gap-2.5">
              <Square className="w-6 h-6 fill-red-400 stroke-none" onClick={onEnd} />
            </div>
          </div>
          <div data-layer="icons-wrapper" className="IconsWrapper h-full flex justify-start items-center">
            <div data-layer="Frame 23" className="Frame23 h-full pr-2 flex justify-center items-center">
              <div data-layer="0:00:00" className="0000 justify-center text-neutral-700 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">
                {formattedTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
