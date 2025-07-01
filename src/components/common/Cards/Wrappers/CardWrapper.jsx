// AI-ASSISTANT-POLICY: STYLING LOCKED
// ==========================================
// ATTENTION AI ASSISTANT:
// Do not modify the styling of this component without explicit user instruction.
// This component's visual appearance has been finalized and approved.
// Any general refactoring or styling updates, especially those based on
// external tools like Figma, should NOT alter the CSS classes, inline styles,
// or other style-related code in this file.
//
// Before making any style changes, confirm directly with the user.
// ==========================================
import React from "react";
import PropTypes from "prop-types";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

// ========= Global CardWrapper spacing constants =========
// Adjust these three numbers to control default spacing everywhere.
export const CARD_WRAPPER_GAP_PX = 0; // default gap removed as per new design
export const CARD_WRAPPER_MARGIN_TOP_PX = 0; // space above the first card
export const CARD_WRAPPER_MARGIN_BOTTOM_PX = 0; // space below the last card

const CardWrapper = React.forwardRef(({
  children,
  className = "",
  cardTitle,
  reorderable = false,
  items = [],
  onReorder = () => {},
  headerRef,
  gap = CARD_WRAPPER_GAP_PX,
  marginTop = CARD_WRAPPER_MARGIN_TOP_PX,
  marginBottom = CARD_WRAPPER_MARGIN_BOTTOM_PX,
  index,
  focusedIndex,
  totalCards,
  ...props
}, ref) => {
  const divProps = { ...props };
  delete divProps.reorderable;
  delete divProps.items;
  delete divProps.onReorder;
  delete divProps.headerRef;
  delete divProps.index;
  delete divProps.focusedIndex;
  delete divProps.totalCards;
  delete divProps.topOffset;

  const zIndex = index + 1; // first card lowest, last highest

  // Style object controlling spacing; cards scroll normally
  const spacingStyle = { rowGap: gap, marginTop, marginBottom };

  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 w-full flex flex-col justify-start items-stretch mx-auto bg-transparent",
        className
      )}
      style={{ maxWidth: 500, ...spacingStyle, ...(props.style || {}) }}
      {...divProps}
    >
      {cardTitle && (
        <div className="w-full bg-gray-50 border-b border-gray-200">
          <h3 className="text-heading-md">{cardTitle}</h3>
        </div>
      )}
      {reorderable ? (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onReorder}
          className="w-full flex flex-col"
          style={{ rowGap: gap }}
        >
          {React.Children.map(children, (child, idx) =>
            React.isValidElement(child) ? (
              <Reorder.Item
                key={items[idx]?.id || idx}
                value={items[idx]}
                className="w-full"
              >
                {child}
              </Reorder.Item>
            ) : (
              child
            )
          )}
        </Reorder.Group>
      ) : (
        children
      )}
    </div>
  );
});

CardWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  cardTitle: PropTypes.string,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
  headerRef: PropTypes.object,
  gap: PropTypes.number,
  marginTop: PropTypes.number,
  marginBottom: PropTypes.number,
  index: PropTypes.number,
  focusedIndex: PropTypes.number,
  totalCards: PropTypes.number,
};

export default CardWrapper;
