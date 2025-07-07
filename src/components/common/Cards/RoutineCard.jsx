import React from "react";
import PropTypes from "prop-types";
import { Settings2 } from "lucide-react";

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
const RoutineCard = ({ id, name, lastCompleted, onStart, onSettings }) => {
  return (
    <div
      data-layer="Routine Card"
      className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex flex-col justify-start items-start gap-10 cursor-pointer"
      onClick={onStart}
    >
      <div
        data-layer="Frame 5001"
        className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5"
      >
        <div
          data-layer="Frame 5007"
          className="Frame5007 self-stretch flex flex-col justify-start items-start"
        >
          <div
            data-layer="Frame 5003"
            className="Frame5003 self-stretch inline-flex justify-start items-start gap-5"
          >
            <div
              data-layer={name}
              className="BicepsAndChest flex-1 justify-start text-neutral-700 text-xl font-medium font-['Be Vietnam Pro'] leading-normal"
            >
              {name}
            </div>
            <div
              data-layer="Frame 5006"
              className="Frame5006 flex justify-start items-center gap-2.5"
              onClick={(e) => {
                e.stopPropagation();
                onSettings?.();
              }}
            >
              <Settings2 className="text-neutral-700" size={20} />
            </div>
          </div>
          <div
            data-layer="Tap to start"
            className="TapToStart text-center justify-center text-neutral-400 text-sm font-medium font-['Be Vietnam Pro'] leading-tight"
          >
            Tap to start
          </div>
        </div>
      </div>
      {lastCompleted && (
        <div
          data-layer="Completed 5 days ago"
          className="Completed5DaysAgo text-center justify-center text-neutral-400 text-sm font-medium font-['Be Vietnam Pro'] leading-tight"
        >
          {lastCompleted}
        </div>
      )}
    </div>
  );
};

RoutineCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  lastCompleted: PropTypes.string,
  onStart: PropTypes.func,
  onSettings: PropTypes.func,
};

export default RoutineCard; 
// gjkgfhjk
