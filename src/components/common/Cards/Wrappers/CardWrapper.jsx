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
import { useState } from "react";

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
  grid = false,
  gridCols = "grid-cols-1", // Default grid columns for mobile
  gridColsSm = null, // Grid columns for sm breakpoint and up
  gridTemplateColumns = null, // Custom CSS grid-template-columns
  justifyGrid = "justify-start", // Grid justify behavior
  maxWidth = null, // Max width for grid container
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
  delete divProps.grid;
  delete divProps.gridCols;
  delete divProps.gridColsSm;
  delete divProps.gridTemplateColumns;
  delete divProps.justifyGrid;
  delete divProps.maxWidth;

  const zIndex = index + 1; // first card lowest, last highest

  // Style object controlling spacing; cards scroll normally
  const spacingStyle = grid
    ? { gap: gap, marginTop, marginBottom }
    : { rowGap: gap, marginTop, marginBottom };

  const [dragging, setDragging] = useState(false);

  // Layout classes: grid or flex-col
  let layoutClasses;
  if (grid) {
    layoutClasses = `grid ${justifyGrid}`;
  } else {
    layoutClasses = "flex flex-col justify-start items-stretch";
  }

  const containerClasses = cn(
    "relative z-10 w-full mx-auto bg-transparent border-b border-neutral-300",
    // Add top border if this is the first card
    props.isFirstCard && "border-t border-neutral-300",
    layoutClasses,
    className
  );

  // Apply styles based on layout type
  let style = { ...spacingStyle, ...(props.style || {}) };
  
  if (grid) {
    // Grid layout styling
    if (maxWidth) {
      style.maxWidth = maxWidth;
    }
    if (gridTemplateColumns) {
      style.gridTemplateColumns = gridTemplateColumns;
    }
  } else {
    // Flex layout styling (individual cards)
    // Max width is now managed by DeckWrapper
  }

  return (
    <div
      ref={ref}
      className={containerClasses}
      style={style}
      {...divProps}
    >
        {cardTitle && (
          <div className="w-full bg-gray-50 border-b border-gray-200">
            <h3 className="text-heading-md">{cardTitle}</h3>
          </div>
        )}
        {reorderable && items && onReorder ? (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onReorder}
          className="w-full flex flex-col"
          style={{ rowGap: gap }}
        >
          {React.Children.map(children, (child, idx) => {
            if (!React.isValidElement(child)) return child;

            return (
              <Reorder.Item
                key={items[idx]?.id || idx}
                value={items[idx]}
                className="w-full"
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
              >
                {typeof child.type === "string"
                  ? child // don't pass extra props to DOM elements
                  : React.cloneElement(child, { isDragging: dragging })}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      ) : (
        React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          
          // Forward isFirstCard prop to children
          return React.cloneElement(child, {
            ...child.props,
            isFirstCard: props.isFirstCard
          });
        })
      )}
    </div>
  );
});

CardWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  cardTitle: PropTypes.string,
  reorderable: PropTypes.bool,
  grid: PropTypes.bool,
  gridCols: PropTypes.string,
  gridColsSm: PropTypes.string,
  gridTemplateColumns: PropTypes.string,
  justifyGrid: PropTypes.string,
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  items: PropTypes.array,
  onReorder: PropTypes.func,
  headerRef: PropTypes.object,
  gap: PropTypes.number,
  marginTop: PropTypes.number,
  marginBottom: PropTypes.number,
  index: PropTypes.number,
  focusedIndex: PropTypes.number,
  totalCards: PropTypes.number,
  isFirstCard: PropTypes.bool,
};

export default CardWrapper;
