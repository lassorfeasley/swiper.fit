import React from "react";
import PropTypes from "prop-types";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import { cn } from "@/lib/utils";

/**
 * WorkoutSectionWrapper – container for a single workout section (warmup / training / cooldown).
 * Provides consistent padding, drop-shadow, and section heading.
 * Children are rendered inside a DeckWrapper so callers only need to pass in the cards.
 */
const WorkoutSectionWrapper = ({ section, children, className, ...props }) => {
  // Map raw section key to display name
  const displayTitle = (() => {
    if (!section) return "";
    const lowered = section.toLowerCase();
    if (lowered === "training" || lowered === "workout") return "Training";
    if (lowered === "warmup") return "Warmup";
    if (lowered === "cooldown") return "Cooldown";
    // Fallback – capitalize first letter
    return section.charAt(0).toUpperCase() + section.slice(1);
  })();

  return (
    <div
      className={cn(
        "Workoutcardwrapper w-full max-w-[1472px] bg-white shadow-[0px_0px_16px_0px_rgba(212,212,212,1)] border-t border-neutral-300 inline-flex flex-col justify-center items-center",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="self-stretch p-5 border-b border-neutral-300 flex items-center gap-2.5 sticky top-0 bg-white z-20 md:z-5 pointer-events-none">
        <h2 className="flex-1 text-neutral-600 text-2xl font-bold leading-normal capitalize">
          {displayTitle}
        </h2>
      </div>

      {/* Content with spacing around header & footer */}
      <div className="self-stretch flex flex-col justify-start items-center gap-10">
        <div className="self-stretch pt-5 pb-28 flex flex-col justify-center items-center gap-14">
          <DeckWrapper>{children}</DeckWrapper>
        </div>
      </div>
    </div>
  );
};

WorkoutSectionWrapper.propTypes = {
  section: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default WorkoutSectionWrapper; 