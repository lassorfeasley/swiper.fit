import React, { useEffect } from "react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { formatSecondsHHMMSS } from "@/lib/utils";
import { Square, Pause, Play } from "lucide-react";

export default function ActiveWorkoutNav({ onEnd, progress = 0 }) {
  const { activeWorkout, elapsedTime, isPaused, pauseWorkout, resumeWorkout, loading } = useActiveWorkout();
  const formattedTime = formatSecondsHHMMSS(elapsedTime);

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
        <div data-layer="workout-name" className="self-stretch justify-center text-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">
          {activeWorkout?.workout_name || "Test Workout Name"}
        </div>
        <div data-layer="routine-name" className="self-stretch justify-center text-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-normal">
          {activeWorkout?.routine_name || activeWorkout?.routines?.routine_name || "Test Routine Name"}
        </div>
      </div>

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
                    disabled={loading}
                    className={`ActionPill size-10 bg-green-600 rounded-[20px] flex justify-center items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                  <button
                    type="button"
                    aria-label="End workout"
                    onClick={onEnd}
                    disabled={loading}
                    className={`ActionPill size-10 bg-neutral-900 rounded-[20px] flex justify-center items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Square className="w-6 h-6 text-white" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  aria-label="Pause workout"
                  onClick={pauseWorkout}
                  disabled={loading || !activeWorkout}
                  className={`ActionPill size-10 bg-orange-600 rounded-[20px] flex justify-center items-center ${loading || !activeWorkout ? 'opacity-50 cursor-not-allowed' : ''}`}
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




