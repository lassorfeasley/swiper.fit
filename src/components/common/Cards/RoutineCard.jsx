import React from "react";
import PropTypes from "prop-types";

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
const RoutineCard = ({ id, name, lastCompleted, onStart, isFirstCard }) => {
  return (
    <div
      data-layer="Routine Card"
      className="w-full max-w-[500px] p-3 bg-white inline-flex flex-col justify-start items-start gap-6 cursor-pointer"
      onClick={onStart}
    >
      <div className="self-stretch flex flex-col justify-start items-start gap-5">
        <div className="self-stretch flex flex-col justify-start items-start">
          <div className="w-full justify-start text-neutral-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {name}
          </div>
          {lastCompleted && (
            <div className="text-center justify-center text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
              {lastCompleted}
            </div>
          )}
        </div>
      </div>
      <div className="text-center justify-center text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
        Review and start workout
      </div>
    </div>
  );
};

RoutineCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  lastCompleted: PropTypes.string,
  onStart: PropTypes.func,
  isFirstCard: PropTypes.bool,
};

export default RoutineCard; 
// gjkgfhjk
