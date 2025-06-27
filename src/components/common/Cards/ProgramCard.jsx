import React from "react";
import PropTypes from "prop-types";
import SwipeSwitch from "@/components/molecules/swipe-switch";

/**
 * ProgramCard – card representation of a workout program with swipe-to-action control.
 *
 * Props:
 *  • id – program identifier (used for React key only).
 *  • name – program name.
 *  • exerciseCount – number of exercises in program.
 *  • setCount – total sets in program.
 *  • leftText – label shown bottom-left (e.g. "Swipe to begin").
 *  • rightText – label shown bottom-right (e.g. "Completed 4 days ago").
 *  • swipeStatus – status to pass to SwipeSwitch (defaults to "active").
 *  • onSwipeComplete – callback when user completes swipe gesture.
 */
const ProgramCard = ({
  id,
  name,
  exerciseCount,
  setCount,
  leftText = "Swipe to begin",
  rightText = "",
  swipeStatus = "active",
  onSwipeComplete,
}) => {
  return (
    <div
      key={id}
      data-component="ProgramCard"
      className="Programcardcontents w-full max-w-[500px] bg-white rounded-xl inline-flex flex-col justify-start items-start"
    >
      {/* Header: Workout Name full width */}
      <div className="w-full px-4 pt-4 flex flex-col items-start gap-2">
        <div className="w-full text-slate-950 text-lg font-medium leading-tight font-['Be_Vietnam_Pro']">
          {name}
        </div>
        <div className="flex flex-row flex-wrap gap-2 w-full">
          {typeof exerciseCount === "number" && (
            <div className="px-2 py-1 bg-slate-200 rounded-sm flex justify-center items-center">
              <span className="text-slate-500 text-xs font-medium leading-none whitespace-nowrap">
                {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
              </span>
            </div>
          )}
          {typeof setCount === "number" && (
            <div className="px-2 py-1 bg-slate-200 rounded-sm flex justify-center items-center">
              <span className="text-slate-500 text-xs font-medium leading-none whitespace-nowrap">
                {setCount} {setCount === 1 ? "set" : "sets"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Switch & footer */}
      <div className="self-stretch px-5 py-4 flex flex-col gap-2">
        {/* Swipe control */}
        <SwipeSwitch status={swipeStatus} onComplete={onSwipeComplete} />

        {/* Bottom text row */}
        {(leftText || rightText) && (
          <div className="self-stretch inline-flex justify-between items-start">
            <div className="text-slate-400 text-xs font-medium leading-none">
              {leftText}
            </div>
            <div className="text-slate-400 text-xs font-medium leading-none">
              {rightText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ProgramCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  exerciseCount: PropTypes.number,
  setCount: PropTypes.number,
  leftText: PropTypes.string,
  rightText: PropTypes.string,
  swipeStatus: PropTypes.string,
  onSwipeComplete: PropTypes.func,
};

export default ProgramCard; 