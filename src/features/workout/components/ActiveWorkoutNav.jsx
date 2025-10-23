import React, { useEffect } from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { formatSecondsHHMMSS } from "@/lib/utils";
import { Blend, X, Square, Pause, Play } from "lucide-react";
import { ActionPill } from "@/components/shared/ActionPill";

export default function ActiveWorkoutNav({ onEnd, progress = 0 }) {
  const { activeWorkout, elapsedTime, isPaused, pauseWorkout, resumeWorkout } = useActiveWorkout();
  const { isDelegated, actingUser, returnToSelf } = useAccount();
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

  useEffect(() => {
    const sub = document.getElementById("sticky-subnav");
    const sent = document.getElementById("sticky-subnav-sentinel");
    if (!sub || !sent) return;

    let blocked = false;

    // DEBUG: warn if any ancestor blocks position: sticky
    const debugSticky = (el) => {
      if (!el) return;
      try {
        const cs = getComputedStyle(el);
        // eslint-disable-next-line no-console
        console.log('[StickySubNav]', { position: cs.position, top: cs.top, zIndex: cs.zIndex });
      } catch (_) {}
      let p = el.parentElement;
      while (p) {
        const cs = getComputedStyle(p);
        const ov = cs.overflow;
        const ovY = cs.overflowY;
        const hasOverflow = ["hidden", "auto", "scroll", "clip"].includes(ov) || ["hidden", "auto", "scroll", "clip"].includes(ovY);
        if (hasOverflow) {
          // eslint-disable-next-line no-console
          console.warn("[Sticky blocked by ancestor]", p, { overflow: ov, overflowY: ovY });
          blocked = true;
        }
        p = p.parentElement;
      }
    };
    debugSticky(sub);

    const io = new IntersectionObserver(([e]) => {
      const isStuck = !e.isIntersecting;
      sub.classList.toggle("is-stuck", isStuck);
      // Only force fixed positioning when actually stuck and sticky is blocked by overflow ancestors
      sub.classList.toggle("force-fixed", isStuck && blocked);
    });
    io.observe(sent);

    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* PrimaryNavScrollable - scrolls away */}
      <div data-layer="active-workout-name-and-routine" className="ActiveWorkoutNameAndRoutine self-stretch flex flex-col justify-center items-start px-4 md:px-8 pt-5 pb-0 bg-stone-100">
        <div data-layer="workout-name" className="self-stretch justify-center text-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-[24px]">
          {activeWorkout?.workoutName || ""}
        </div>
        <div data-layer="routine-name" className="self-stretch justify-center text-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
          {activeWorkout?.routineName || ""}
        </div>
      </div>

      {/* Delegate banner (part of PrimaryNavScrollable) */}
      {isDelegated && (
        <div data-layer="Frame 84" className="Frame84 self-stretch px-3 pt-3 bg-stone-100 inline-flex justify-start items-start gap-2.5">
          <div data-layer="Frame 73" className="Frame73 inline-flex pl-2 pr-5 bg-neutral-950 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] items-center">
            <div data-layer="IconButton" data-property-1="Default" data-show-text="false" className="Iconbutton size-10 p-2.5 flex justify-start items-center gap-2.5">
              <Blend className="w-6 h-6 text-white" />
            </div>
            <div data-layer="Frame 71" className="Frame71 size- flex justify-center items-center gap-5">
              <div data-layer="[user]" className="ManagingUserSAccount justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                {formatUserDisplay(actingUser)}
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

      {/* 0-height sentinel just above StickySubNav */}
      <div id="sticky-subnav-sentinel" aria-hidden="true" className="h-0" />

      {/* StickySubNav - sticks to viewport top */}
      <div
        id="sticky-subnav"
        data-no-transform
        className="sticky [top:var(--header-height,0px)] left-0 right-0 w-full z-[120] flex items-center border-b border-transparent transition-[box-shadow,border-color] duration-150 bg-transparent"
      >
        <div data-layer="Frame 57" className="Frame57 w-full h-full px-4 md:px-8 pt-5 pb-0 inline-flex justify-between items-center bg-gradient-to-b from-stone-100 to-stone-100/0">
          <div
            data-layer="Property 1=Default"
            className={`Property1Default w-full p-2 ${isPaused ? 'bg-orange-500' : 'bg-white/70'} rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] relative overflow-hidden transition-colors duration-300 ease-in-out`}
          >
            {/* Progress fill layer */}
            <div
              aria-hidden
              className={`absolute inset-0 ${isPaused ? 'bg-orange-600' : 'bg-green-600'} transition-colors duration-300 ease-in-out`}
              style={{
                transform: `scaleX(${Math.min(Math.max(progress, 0), 1)})`,
                transformOrigin: 'left',
                transition: 'transform 400ms ease'
              }}
            />

            {/* Foreground content */}
            <div className="relative z-10 w-full inline-flex justify-between items-center">
              <div data-layer="clock-wrapper" className="ClockWrapper h-10 px-3 bg-neutral-neutral-100 rounded-3xl flex justify-center items-center gap-2.5">
                <div data-layer="timer" className="Timer justify-center text-neutral-950 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">{formattedTime}</div>
              </div>
              <div className="inline-flex items-center gap-2">
              {isPaused ? (
                <>
                  <button
                    type="button"
                    aria-label="Resume workout"
                    onClick={resumeWorkout}
                    className="ActionPill size-10 bg-green-600 rounded-[20px] flex justify-center items-center"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <button
                    type="button"
                    aria-label="End workout"
                    onClick={onEnd}
                    className="ActionPill size-10 bg-neutral-900 rounded-[20px] flex justify-center items-center"
                  >
                    <Square className="w-6 h-6 text-white" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  aria-label="Pause workout"
                  onClick={pauseWorkout}
                  className="ActionPill size-10 bg-orange-600 rounded-[20px] flex justify-center items-center"
                >
                  <Pause className="w-6 h-6 text-white" />
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}




