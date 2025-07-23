import React, { forwardRef, useState, useRef } from "react";
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
      maxWidth = 500, // maximum width (px)
      minWidth = 325, // minimum width (px)
      className,
      reorderable = false,
      items = [],
      onReorder,
      isFirstCard, // Extract isFirstCard to prevent it from being spread to DOM
      ...props
    },
    ref
  ) => {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef(null);
    
    // Filter out isFirstCard from props to prevent React warning
    const { isFirstCard: _, ...domProps } = props;

    // Count number of child elements to enable responsive tweaks (flatten fragments)
    const childCount = React.Children.toArray(children).length;
    
    const style = {
      gap,
      paddingTop: 40,
      paddingBottom: 80,
      maxWidth: `${maxWidth}px`,
      minWidth: `${minWidth}px`,
      ...(props.style || {}),
    };

    const containerClasses = cn(
      "card-container w-full flex flex-col items-center border-l border-r border-neutral-300",
      className
    );

    if (reorderable && items.length > 0) {
      return (
        <div
          ref={(node) => {
            containerRef.current = node;
            if (ref) {
              if (typeof ref === 'function') {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          className={containerClasses}
          style={style}
          {...domProps}
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
                  position: "relative",
                  borderBottom: "1px solid #d4d4d4",
                  ...(idx === 0 && { borderTop: "1px solid #d4d4d4" })
                }}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                dragConstraints={containerRef}
                dragElastic={0}
                whileDrag={{ 
                  zIndex: 9999,
                  boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.3), 0 10px 20px -4px rgba(0, 0, 0, 0.2)",
                  borderBottom: "1px solid #d4d4d4",
                  ...(idx === 0 && { borderTop: "1px solid #d4d4d4" })
                }}
              >
                <div className="w-full">
                  {React.Children.toArray(children)[idx] && 
                    React.cloneElement(React.Children.toArray(children)[idx], { 
                      reorderable: true, 
                      reorderValue: item, 
                      isDragging: false, // We'll handle this differently
                      isFirstCard: idx === 0
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
        {...domProps}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          
          // Add isFirstCard prop to the first child
          return React.cloneElement(child, {
            ...child.props,
            isFirstCard: index === 0
          });
        })}
      </div>
    );
  }
);

DeckWrapper.displayName = "DeckWrapper";

DeckWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  gap: PropTypes.number,
  paddingX: PropTypes.number,
  maxWidth: PropTypes.number,
  minWidth: PropTypes.number,
  className: PropTypes.string,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
  isFirstCard: PropTypes.bool,
};

export default DeckWrapper; 