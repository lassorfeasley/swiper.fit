import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

/**
 * DeckWrapper – a vertical flex container meant to hold a stack of CardWrapper components.
 * Keeps layout semantics in one place (padding, gap, max-width) so pages don't recreate the same div.
 */
const DeckWrapper = forwardRef(
  (
    {
      children,
      gap = 0, // spacing between items
      paddingX = 20, // horizontal padding (px)
      // When truthy, enables CSS grid; if a number, that is treated as the column min-width (px)
      grid = false,
      gridMinWidth = 210,
      className,
      ...props
    },
    ref
  ) => {
    const isGrid = Boolean(grid);
    const minWidthPx = typeof grid === "number" ? grid : gridMinWidth;

    // Count number of child elements to enable responsive tweaks (flatten fragments)
    const childCount = React.Children.toArray(children).length;

    const style = {
      gap,
      paddingLeft: paddingX,
      paddingRight: paddingX,
      paddingTop: 0,
      paddingBottom: 0,
      ...(props.style || {}),
    };

    // Apply grid specific inline styles
    if (isGrid) {
      style.display = "grid";
      // Align grid tracks and items to the start (left) to prevent centering when there is extra space
      style.justifyContent = "start";
      style.justifyItems = "start";
      // Ensure each card has at least minWidthPx and can expand to fill available space
      style.gridTemplateColumns = `repeat(auto-fit,minmax(${minWidthPx}px,1fr))`;
    }

    const containerClasses = cn(
      "card-container mx-auto w-full",
      !isGrid && "flex flex-col",
      className
    );

    return (
      <div
        ref={ref}
        className={containerClasses}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DeckWrapper.displayName = "DeckWrapper";

DeckWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  gap: PropTypes.number,
  paddingX: PropTypes.number,
  /** When truthy enables grid; can be boolean or a number (min col width) */
  grid: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  /** Fallback min column width when grid is boolean */
  gridMinWidth: PropTypes.number,
  className: PropTypes.string,
};

export default DeckWrapper; 