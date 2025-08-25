import React from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { formatSeconds } from "@/lib/utils";

export default function ActiveWorkoutNav({ onEnd }) {
  const { activeWorkout, elapsedTime } = useActiveWorkout();
  const { isDelegated } = useAccount();
  const topOffset = isDelegated ? 'top-11' : 'top-0';
  const formattedTime = formatSeconds(elapsedTime);
  return (
    <div data-layer="ActiveWorkoutNav" className={`fixed ${topOffset} left-0 right-0 w-full self-stretch bg-white inline-flex flex-col justify-start items-start overflow-hidden z-50`}>
      <div className="self-stretch bg-neutral-700 h-8">
        <div className="MaxWidthWrapper h-full px-3 inline-flex justify-start items-center overflow-hidden">
          <div className="justify-center text-white text-xs font-bold uppercase leading-3 tracking-wide">
            {activeWorkout?.routineName || ''}
          </div>
        </div>
      </div>
      <div className="self-stretch h-11 border-b border-neutral-300">
        <div className="MaxWidthWrapper h-full pl-3 flex justify-between items-center">
          <div className="justify-center text-neutral-700 text-2xl font-bold leading-8">{formattedTime}</div>
          <div role="button" onClick={onEnd} className="w-48 h-full px-4 py-2 bg-white border-l border-neutral-300 flex justify-center items-center gap-2.5 cursor-pointer select-none">
            <div className="justify-start text-red-600 text-base font-medium leading-tight">End workout</div>
          </div>
        </div>
      </div>
    </div>
  );
}


