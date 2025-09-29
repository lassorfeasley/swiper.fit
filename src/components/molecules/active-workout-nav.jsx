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
    <div data-layer="ActiveWorkoutNav" className={`fixed ${topOffset} left-0 right-0 w-full self-stretch inline-flex flex-col justify-start items-start z-50 bg-[linear-gradient(to_top,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)]`}>
      {/* Timer + Action icon row (full-bleed) */}
      <div className="self-stretch pt-5 px-5">
        <div data-layer="Frame 57" className="Frame57 w-full inline-flex justify-between items-start">
          <div data-layer="Frame 56" className="Frame56 h-10 px-2.5 py-2 bg-white rounded-[50px] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] flex justify-center items-center gap-2.5">
            <div data-layer="timer" className="Timer justify-center text-neutral-950 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">{formattedTime}</div>
          </div>
          <button
            type="button"
            onClick={onEnd}
            data-layer="Frame 58"
            className="Frame58 h-12 flex justify-center items-start gap-2"
          >
            <div data-layer="action-icons" className="ActionIcons w-12 h-12 p-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] flex justify-center items-center gap-2">
              <div data-svg-wrapper data-layer="lucide-icon" className="LucideIcon relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}




