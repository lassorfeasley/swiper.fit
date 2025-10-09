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
  backgroundClass = "bg-transparent",
  paddingX = 20,
  style,
  applyPaddingOnParent = false,
  ...props 
}) => {
  // Filter out isFirstCard from props to prevent React warning
  const { isFirstCard, ...domProps } = props;
  // Separate style from domProps so we can control outer margin without interference
  const { style: incomingStyle, ...restDomProps } = domProps;
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

  // When applying padding on the parent, only propagate padding (not max-width) to the parent wrapper
  const parentPaddingStyle = applyPaddingOnParent
    ? {
        paddingLeft: style?.paddingLeft,
        paddingRight: style?.paddingRight,
        paddingBottom: style?.paddingBottom,
      }
    : undefined;

  return (
    <div
      className={cn(
        "Workoutcardwrapper w-full flex flex-col justify-start items-center",
        backgroundClass,
        className
      )}
      style={applyPaddingOnParent 
        ? { marginBottom: className?.includes("flex-1") ? 0 : 40 }
        : { ...(incomingStyle || {}), marginBottom: className?.includes("flex-1") ? 0 : 40 }}
      {...restDomProps}
    >
      {/* Content with the section title rendered inside DeckWrapper header */}
      <div
        className={cn("w-full pb-0 flex justify-center", className?.includes("flex-1") && "flex-1") }
        style={parentPaddingStyle}
      >
        <DeckWrapper 
          gap={deckGap}
          paddingX={applyPaddingOnParent ? 0 : paddingX}
          paddingTop={applyPaddingOnParent ? 0 : undefined}
          paddingBottom={0}
          useChildMargin={!reorderable}
          reorderable={reorderable}
          items={items}
          onReorder={onReorder}
          variant={deckVariant}
          maxWidth={500}
          style={applyPaddingOnParent ? { maxWidth: style?.maxWidth || 500, minWidth: style?.minWidth } : style}
          header={(
            <div className="w-full inline-flex justify-center items-center gap-2.5" style={{ marginBottom: 0 }}>
              <div className="flex flex-1 items-center justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">
                {displayTitle}
              </div>
              {showPlusButton && (
                <button onClick={onPlus} aria-label="Add exercise" className="p-1">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.11663 13H24M13.2083 2.20834V23.7917" stroke="#A3A3A3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}
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