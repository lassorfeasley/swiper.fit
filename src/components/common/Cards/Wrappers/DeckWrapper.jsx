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
      ...props
    },
    ref
  ) => {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef(null);
    
    // Filter out isFirstCard and extendToBottom from props to prevent React warning
    const { isFirstCard, extendToBottom, ...domProps } = props;

    // Count number of child elements to enable responsive tweaks (flatten fragments)
    const childCount = React.Children.toArray(children).length;
    
    const style = {
      gap,
      paddingTop: 40,
      paddingBottom: extendToBottom ? 0 : 80,
      maxWidth: `${maxWidth}px`,
      minWidth: `${minWidth}px`,
      ...(props.style || {}),
    };

    const containerClasses = cn(
      "card-container w-full flex flex-col items-center border-l border-r border-neutral-300 mx-5",
      extendToBottom && "min-h-screen",
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
                className={`w-full flex justify-center ${idx === 0 ? 'border-t border-neutral-300' : ''} border-b border-neutral-300`}
                style={{ 
                  touchAction: "none",
                  position: "relative"
                }}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                dragConstraints={containerRef}
                dragElastic={0}
                whileDrag={{ 
                  zIndex: 9999,
                  boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.3), 0 10px 20px -4px rgba(0, 0, 0, 0.2)"
                }}
              >
                <div className="w-full">
                  {React.Children.toArray(children)[idx] && 
                    (() => {
                      const childEl = React.Children.toArray(children)[idx];
                      if (!React.isValidElement(childEl)) return childEl;
                      const extraProps = {
                        reorderable: true,
                        reorderValue: item,
                        isDragging: false, // We'll handle this differently,
                      };
                      if (typeof childEl.type !== 'string') {
                        extraProps.isFirstCard = idx === 0;
                      }
                      return React.cloneElement(childEl, extraProps);
                    })()
                  }
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          
          {/* Render additional children that are not part of the reorderable items */}
          {React.Children.toArray(children).slice(items.length).map((child, index) => {
            if (!React.isValidElement(child)) return child;
            return (
              <div 
                key={`additional-${index}`}
                className="w-full flex justify-center"
              >
                {React.cloneElement(child, {
                  ...(() => {
                    const { isFirstCard: _, ...filteredProps } = child.props;
                    return filteredProps;
                  })(),
                })}
              </div>
            );
          })}
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
          
          // Wrap each child in a div with appropriate borders
          const isLastChild = index === React.Children.count(children) - 1;
          const isFirstChild = index === 0;
          return (
            <div 
              key={child.key || index}
              className={`w-full flex justify-center ${isFirstChild ? 'border-t border-neutral-300' : ''}`}
            >
              {React.cloneElement(child, {
                ...(() => {
                  const { isFirstCard: _, ...filteredProps } = child.props;
                  return filteredProps;
                })(),
                ...(
                  typeof child.type !== 'string' ? { isFirstCard: index === 0 } : {}
                )
              })}
            </div>
          );
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
  extendToBottom: PropTypes.bool,
};

export default DeckWrapper; 