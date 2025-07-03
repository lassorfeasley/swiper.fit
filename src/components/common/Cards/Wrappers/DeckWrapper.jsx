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
      paddingX = 12, // horizontal padding (px)
      grid = false, // horizontal layout when true
      className,
      ...props
    },
    ref
  ) => {
    // Common inline style for gaps and padding
    const style = {
      gap: gap,
      // apply rowGap and columnGap via gap shorthand
      paddingLeft: paddingX,
      paddingRight: paddingX,
      paddingTop: 0,
      paddingBottom: 0,
      ...(props.style || {}),
    };
    // Determine flex direction classes with object syntax for purge safety
    const containerClasses = cn(
      "card-container flex mx-auto w-full md:px-0",
      { "flex-row flex-wrap": grid, "flex-col": !grid },
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
  /** When true, lays out children horizontally with wrapping */
  grid: PropTypes.bool,
  className: PropTypes.string,
};

export default DeckWrapper; 