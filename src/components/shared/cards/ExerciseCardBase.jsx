import React from "react";
import PropTypes from "prop-types";
import { Repeat2, Weight, Clock } from "lucide-react";

// Presentational base for exercise-style cards used in routine builder and workout summary
const ExerciseCardBase = ({
  exerciseName,
  sets = [],
  rightHeader,
  onSetClick,
  className = "",
  addTopBorder = false,
  style,
  ...domProps
}) => {
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

  return (
    <div
      data-layer="exercise-card-base"
      className={`ExerciseCard w-full max-w-[500px] bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden ${className}`}
      style={style}
      {...domProps}
    >
      {/* Header */}
      <div
        data-layer="card-label"
        className={`self-stretch pl-4 bg-neutral-neutral-200 inline-flex justify-start items-center gap-4${addTopBorder ? " border-t border-neutral-neutral-300" : ""}`}
      >
        <div className="flex-1 h-11 flex items-center justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
          {exerciseName}
        </div>
        {rightHeader && (
          <div data-layer="IconButton" className="p-2.5 flex justify-start items-center gap-2.5">
            {rightHeader}
          </div>
        )}
      </div>

      {/* Set rows */}
      {sets && sets.length > 0 && (
        <>
          {sets.map((config, idx) => {
            const rowClasses = [
              "self-stretch h-11 px-4 inline-flex justify-between items-center overflow-hidden",
              idx % 2 === 1 ? "bg-neutral-50" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const handleClick = onSetClick
              ? (e) => {
                  e.stopPropagation();
                  onSetClick(idx, config);
                }
              : undefined;

            const setName = config.set_variant || `Set ${idx + 1}`;

            return (
              <div key={idx} data-layer="card-row" className={rowClasses} onClick={handleClick}>
                <div className="justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  {setName}
                </div>
                <div data-layer="metrics" className="self-stretch min-w-12 flex justify-start items-center gap-px overflow-hidden">
                  {/* First metric: Reps or Time */}
                  <div className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div className="size-4 relative overflow-hidden flex items-center justify-center">
                      {config.set_type === "timed" ? (
                        <Clock className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      ) : (
                        <Repeat2 className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="text-center justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {config.set_type === "timed"
                        ? formatTime(config.timed_set_duration || 0)
                        : config.reps || 0}
                    </div>
                  </div>
                  {/* Weight */}
                  <div className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div className="size-4 relative overflow-hidden flex items-center justify-center">
                      <Weight className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                    </div>
                    <div className="text-center justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {config.unit === "body" ? "BW" : config.weight || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

ExerciseCardBase.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  sets: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      set_type: PropTypes.string,
      timed_set_duration: PropTypes.number,
      set_variant: PropTypes.string,
    })
  ),
  rightHeader: PropTypes.node,
  onSetClick: PropTypes.func,
  className: PropTypes.string,
  addTopBorder: PropTypes.bool,
  style: PropTypes.object,
};

export default ExerciseCardBase;


