import React, { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import { Repeat2, Weight, Clock } from "lucide-react";

const WorkoutSummaryCard = ({ exerciseName, sets = [], className = "", addTopBorder = false, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (secs) => {
    const total = Math.max(0, Math.floor(secs || 0));
    const hNum = Math.floor(total / 3600);
    const mNum = Math.floor((total % 3600) / 60);
    const s = (total % 60).toString().padStart(2, "0");
    if (hNum > 0) {
      const h = String(hNum).padStart(2, "0");
      const m = String(mNum).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    if (mNum === 0) return `:${s}`;
    return `${mNum}:${s}`;
  };

  const getSetCountText = () => {
    const count = sets?.length || 0;
    if (count === 1) return "One set";
    if (count === 2) return "Two sets";
    if (count === 3) return "Three sets";
    return `${count} sets`;
  };

  return (
    <div
      className={`Property1WorkoutSummary w-full max-w-[500px] bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden ${className}`}
      style={style}
    >
      {/* Header - Now h-12 and collapsible */}
      <div
        className={`self-stretch h-12 px-2 bg-white border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-4${addTopBorder ? " border-t border-neutral-neutral-300" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <div className="flex-1 inline-flex flex-col justify-start items-start">
          <div className="self-stretch justify-start text-neutral-neutral-700 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
            {exerciseName}
          </div>
          <div className="justify-start text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
            {getSetCountText()}
          </div>
        </div>
        <div data-layer="lucide-icon" data-icon="chevron-down" className="size-6 relative overflow-hidden">
          <ChevronDown 
            className={`w-6 h-6 text-neutral-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Area */}
      {isExpanded && sets && sets.length > 0 && (
        <div data-layer="dropdown-area" className="DropdownArea self-stretch flex flex-col justify-start items-start">
          {sets.map((config, idx) => {
            const rowClasses = [
              "self-stretch h-11 px-2 inline-flex justify-between items-center overflow-hidden",
              idx % 2 === 1 ? "bg-neutral-Neutral-50" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const setName = config.set_variant || `Set ${idx + 1}`;

            return (
              <div key={idx} data-layer="card-row" className={rowClasses}>
                <div className="justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                  {setName}
                </div>
                <div data-layer="metrics" className="self-stretch min-w-12 flex justify-start items-center gap-px overflow-hidden">
                  {/* First metric: Reps or Time */}
                  <div className="self-stretch pl-2 flex justify-center items-center gap-0.5">
                    <div className="size-4 relative overflow-hidden flex items-center justify-center">
                      {config.set_type === "timed" ? (
                        <Clock className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      ) : (
                        <Repeat2 className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="text-center justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                      {config.set_type === "timed"
                        ? formatTime(config.timed_set_duration || 0)
                        : config.reps || 0}
                    </div>
                  </div>
                  {/* Weight */}
                  <div className="self-stretch pl-2 flex justify-center items-center gap-0.5">
                    <div className="size-4 relative overflow-hidden flex items-center justify-center">
                      <Weight className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                    </div>
                    <div className="text-center justify-center text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
                      {config.unit === "body" ? "BW" : config.weight || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

WorkoutSummaryCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  sets: PropTypes.array,
  className: PropTypes.string,
  addTopBorder: PropTypes.bool,
  style: PropTypes.object,
};

export default WorkoutSummaryCard;


