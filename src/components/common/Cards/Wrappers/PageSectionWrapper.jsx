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
  isFirst = false,
  reorderable = false,
  items = [],
  onReorder,

  style,
  ...props 
}) => {
  // Filter out isFirstCard from props to prevent React warning
  const { isFirstCard, ...domProps } = props;
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
        "Workoutcardwrapper w-full bg-white flex flex-col justify-start items-center",
        className
      )}
      {...domProps}
    >
      {/* Header */}
      <SectionWrapperLabel 
        showPlusButton={showPlusButton} 
        onPlus={onPlus}
      >
        {displayTitle}
      </SectionWrapperLabel>

      {/* Content with spacing around header & footer */}
      <div className={cn("w-full self-stretch px-0 flex justify-center", className?.includes("flex-1") && "flex-1")}>
        <DeckWrapper 
          gap={deckGap} 
          reorderable={reorderable}
          items={items}
          onReorder={onReorder}
          className={className?.includes("flex-1") ? "flex-1" : ""}
          style={style}
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
  isFirst: PropTypes.bool,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,

};

export default PageSectionWrapper; 