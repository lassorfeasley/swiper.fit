import React from "react";
import PropTypes from "prop-types";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import SectionWrapperLabel from "./SectionWrapperLabel";
import { cn } from "@/lib/utils";

/**
 * PageSectionWrapper – container for a single page section (warmup / training / cooldown).
 * Provides consistent padding, drop-shadow, and section heading.
 * Children are rendered inside a DeckWrapper so callers only need to pass in the cards.
 */
const PageSectionWrapper = ({ 
  section, 
  children, 
  className, 
  deckGap = 0, 
  showPlusButton = false, 
  onPlus, 
  isSticky = true, 
  stickyTopClass, 
  isFirst = false,
  reorderable = false,
  items = [],
  onReorder,
  ...props 
}) => {
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
        "Workoutcardwrapper w-full bg-white shadow-[0px_0px_16px_0px_rgba(212,212,212,1)] border-t border-neutral-300 inline-flex flex-col justify-start items-center gap-11",
        className
      )}
      {...props}
    >
      {/* Header */}
      <SectionWrapperLabel showPlusButton={showPlusButton} onPlus={onPlus} isSticky={isSticky} stickyTopClass={stickyTopClass}>
        {displayTitle}
      </SectionWrapperLabel>

      {/* Content with spacing around header & footer */}
      <div className={cn("w-full self-stretch pb-28 px-0")}>
        <DeckWrapper 
          gap={deckGap} 
          paddingX={20} 
          reorderable={reorderable}
          items={items}
          onReorder={onReorder}
        >
          {children}
        </DeckWrapper>
      </div>
    </div>
  );
};

PageSectionWrapper.propTypes = {
  section: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  deckGap: PropTypes.number,
  showPlusButton: PropTypes.bool,
  onPlus: PropTypes.func,
  isSticky: PropTypes.bool,
  stickyTopClass: PropTypes.string,
  isFirst: PropTypes.bool,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
};

export default PageSectionWrapper; 