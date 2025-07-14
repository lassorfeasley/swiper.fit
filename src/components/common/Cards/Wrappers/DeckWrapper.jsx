import React, { forwardRef, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";

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
      className,
      reorderable = false,
      items = [],
      onReorder,
      ...props
    },
    ref
  ) => {
    const [dragging, setDragging] = useState(false);

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

    const containerClasses = cn(
      "card-container w-full flex flex-col items-center",
      className
    );

    if (reorderable && items.length > 0) {
      return (
        <div
          ref={ref}
          className={containerClasses}
          style={style}
          {...props}
        >
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={onReorder}
            className="w-full flex flex-col items-center"
            style={{ gap }}
          >
            {items.map((item, idx) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="w-full flex justify-center"
                style={{ 
                  touchAction: "none",
                  position: "relative"
                }}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
              >
                <div className="w-full max-w-[500px]">
                  {React.Children.toArray(children)[idx] && 
                    React.cloneElement(React.Children.toArray(children)[idx], { 
                      reorderable: true, 
                      reorderValue: item, 
                      isDragging: dragging 
                    })
                  }
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      );
    }

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
  className: PropTypes.string,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
};

export default DeckWrapper; 