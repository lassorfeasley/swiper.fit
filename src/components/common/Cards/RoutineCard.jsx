import React from "react";
import PropTypes from "prop-types";
import SwipeSwitch from "@/components/molecules/swipe-switch";

/**
 * RoutineCard – card representation of a workout program with swipe-to-action control.
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
const RoutineCard = ({
  id,
  name,
  exerciseCount,
  setCount,
  leftText = "Swipe to begin",
  rightText = "",
  swipeStatus = "default",
  onSwipeComplete,
}) => {
  return (
    <div
      key={id}
      data-component="RoutineCard"
      className="Programcardcontents w-full max-w-[500px] bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex flex-col justify-start items-start"
    >
      {/* Header: Program name & exercise pills */}
      <div className="CardLable self-stretch px-4 pt-4 inline-flex justify-between items-start">
        <div className="ProgramName justify-start text-slate-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
          {name}
        </div>
        <div className="Cardpillwrapper flex justify-start items-center gap-2">
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
        <SwipeSwitch
          set={{ status: swipeStatus === "active" ? "default" : swipeStatus }}
          onComplete={onSwipeComplete}
        />

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

RoutineCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  exerciseCount: PropTypes.number,
  setCount: PropTypes.number,
  leftText: PropTypes.string,
  rightText: PropTypes.string,
  swipeStatus: PropTypes.string,
  onSwipeComplete: PropTypes.func,
};

export default RoutineCard; 
// gjkgfhjk
