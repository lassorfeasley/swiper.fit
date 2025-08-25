import React from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { formatSecondsHHMMSS } from "@/lib/utils";

export default function ActiveWorkoutNav({ onEnd }) {
  const { activeWorkout, elapsedTime } = useActiveWorkout();
  const { isDelegated } = useAccount();
  const topOffset = isDelegated ? 'top-11' : 'top-0';
  const formattedTime = formatSecondsHHMMSS(elapsedTime);
  return (
    <div data-layer="ActiveWorkoutNav" className={`fixed ${topOffset} left-0 right-0 w-full self-stretch bg-white inline-flex flex-col justify-start items-start overflow-hidden z-50`}>
      {/* Timer + End button row */}
      <div className="self-stretch h-9 flex flex-col justify-center items-start">
        <div className="MaxWidthWrapper self-stretch flex-1 pl-3 inline-flex justify-between items-center">
          <div className="justify-center text-neutral-950 text-2xl font-bold leading-loose">{formattedTime}</div>
          <div
            role="button"
            onClick={onEnd}
            className="self-stretch px-4 py-2 bg-red-500 inline-flex justify-center items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="justify-start text-white text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">End workout</div>
          </div>
        </div>
      </div>
      {/* Routine name bar */}
      <div className="self-stretch px-3 py-2 bg-neutral-950 inline-flex justify-between items-center overflow-hidden">
        <div className="MaxWidthWrapper w-full inline-flex justify-between items-center">
          <div className="flex-1 justify-center text-white text-xs font-bold uppercase leading-3 tracking-wide">{activeWorkout?.routineName || ''}</div>
        </div>
      </div>
    </div>
  );
}




