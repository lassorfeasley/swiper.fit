import React from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { formatSecondsHHMMSS } from "@/lib/utils";
import { Blend, X, Square } from "lucide-react";

export default function ActiveWorkoutNav({ onEnd }) {
  const { activeWorkout, elapsedTime } = useActiveWorkout();
  const { isDelegated, actingUser, returnToSelf } = useAccount();
  // This nav now sits at the very top; we hide the old banner above
  const topOffset = 'top-0';
  const formattedTime = formatSecondsHHMMSS(elapsedTime);

  // Helper function to format user display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";

    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";

    // If we have both first and last name, use them
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // If we only have first name, use it
    if (firstName) {
      return firstName;
    }

    // If we only have last name, use it
    if (lastName) {
      return lastName;
    }

    // If we have no name, just use email
    return email;
  };

  return (
    <div data-layer="ActiveWorkoutNav" className={`fixed ${topOffset} left-0 right-0 w-full self-stretch inline-flex flex-col justify-start items-start overflow-hidden z-50 bg-transparent`}>
      {/* Sharing navigation section - updated styling */}
      {isDelegated && (
        <div data-layer="Frame 84" className="Frame84 self-stretch px-3 pt-3 bg-stone-100 inline-flex justify-start items-start gap-2.5">
          <div data-layer="Frame 73" className="Frame73 inline-flex pl-2 pr-5 bg-neutral-950 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] items-center">
            <div data-layer="IconButton" data-property-1="Default" data-show-text="false" className="Iconbutton size-10 p-2.5 flex justify-start items-center gap-2.5">
              <Blend className="w-6 h-6 text-white" />
            </div>
            <div data-layer="Frame 71" className="Frame71 size- flex justify-center items-center gap-5">
              <div data-layer="Managing [user]'s account" className="ManagingUserSAccount justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                Managing {formatUserDisplay(actingUser)}'s account
              </div>
            </div>
          </div>
          <div data-layer="Frame 58" className="Frame58 size-10 flex justify-center items-start gap-2">
            <button
              type="button"
              aria-label="Exit delegate mode"
              onClick={returnToSelf}
              className="ActionIcons size-10 p-2 bg-neutral-950 rounded-3xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Timer section - updated wrapper styles */}
      <div data-layer="Frame 57" className="Frame57 self-stretch px-4 pt-5 bg-gradient-to-b from-stone-300/20 to-stone-300/0 inline-flex justify-between items-start">
        <div data-layer="Frame 56" className="Frame56 h-10 px-2.5 py-2 bg-white rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2.5">
          <div data-layer="timer" className="Timer justify-center text-neutral-950 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">{formattedTime}</div>
        </div>
        <div data-layer="Frame 58" className="Frame58 size-10 flex justify-center items-start gap-2">
          <div data-layer="action-icons" data-show-icon-one="false" data-show-icon-three="true" data-show-icon-two="false" className="ActionIcons size-10 p-2 bg-white/80 rounded-3xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2">
            <button
              type="button"
              onClick={onEnd}
              className="w-full h-full flex justify-center items-center"
            >
              <Square className="w-6 h-6" stroke="#E7000B" strokeWidth={2} fill="none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




