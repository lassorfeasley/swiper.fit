import React from "react";
import PropTypes from "prop-types";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
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
  deckGap = 12, 
  showPlusButton = false, 
  onPlus, 
  isFirst = false,
  reorderable = false,
  items = [],
  onReorder,
  deckVariant = "list",
  backgroundClass = "bg-white",
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
        "Workoutcardwrapper w-full flex flex-col justify-start items-center",
        backgroundClass,
        className
      )}
      {...domProps}
    >
      {/* Content with the section title rendered inside DeckWrapper header */}
      <div className={cn("w-full self-stretch px-[28px] pb-10 flex justify-center", className?.includes("flex-1") && "flex-1") }>
        <DeckWrapper 
          gap={deckGap}
          useChildMargin={true}
          reorderable={reorderable}
          items={items}
          onReorder={onReorder}
          variant={deckVariant}
          paddingBottom={40}
          className={className?.includes("flex-1") ? "flex-1" : ""}
          style={style}
          header={
            <div className="w-full max-w-[500px] pb-5 inline-flex justify-center items-center gap-2.5">
              <div className="flex-1 justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">
                {displayTitle}
              </div>
              {showPlusButton && (
                <button onClick={onPlus} aria-label="Add exercise" className="h-8 px-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-start items-center gap-2.5">
                  <span className="text-neutral-neutral-700 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">Add exercise</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19M12 5V19" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </div>
          }
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
  deckVariant: PropTypes.oneOf(["list", "cards"]),

};

export default PageSectionWrapper; 