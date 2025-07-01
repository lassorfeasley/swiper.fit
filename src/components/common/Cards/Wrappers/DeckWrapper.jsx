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
      gap = 0, // px gap between CardWrappers (vertical spacing)
      paddingX = 0, // horizontal padding (default 0)
      className,
      ...props
    },
    ref
  ) => {
    const style = {
      gap: gap,
      rowGap: gap,
      paddingLeft: paddingX,
      paddingRight: paddingX,
      paddingTop: 0,
      paddingBottom: 0,
      ...(props.style || {}),
    };

    return (
      <div
        ref={ref}
        className={cn("card-container flex flex-col mx-auto w-full md:px-0", className)}
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
  className: PropTypes.string,
};

export default DeckWrapper; 