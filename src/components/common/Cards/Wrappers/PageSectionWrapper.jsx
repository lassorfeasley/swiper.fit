import React from "react";
import PropTypes from "prop-types";
import SectionWrapperLabel from "./SectionWrapperLabel";
import { cn } from "@/lib/utils";

/**
 * PageSectionWrapper – container for a single page section (warmup / training / cooldown).
 * Provides consistent padding, drop-shadow, and section heading.
 * Children are rendered inside a DeckWrapper so callers only need to pass in the cards.
 */
const PageSectionWrapper = ({ section, children, className, ...props }) => {
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
        "Workoutcardwrapper w-full bg-white shadow-[0px_0px_16px_0px_rgba(212,212,212,1)] border-t border-neutral-300 inline-flex flex-col justify-center items-center last:pb-20 md:last:pb-0",
        className
      )}
      {...props}
    >
      {/* Header */}
      <SectionWrapperLabel>
        {displayTitle}
      </SectionWrapperLabel>

      {/* Content with spacing around header & footer */}
      <div className="w-full self-stretch pt-5 pb-28 flex justify-center items-center gap-14 px-3 md:px-0">
        {children}
      </div>
    </div>
  );
};

PageSectionWrapper.propTypes = {
  section: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default PageSectionWrapper; 