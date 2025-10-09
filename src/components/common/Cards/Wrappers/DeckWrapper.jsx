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
      gap = 12, // spacing between items (px)
      paddingX = 20, // horizontal padding (px)
      paddingTop, // top padding; if undefined, uses header-aware default
      maxWidth = 500, // maximum width (px)
      minWidth = 0, // minimum width (px)
      className,
      variant = "list", // "list" shows deck borders and separators, "cards" centers standalone card components
      reorderable = false,
      items = [],
      onReorder,
      forceMinHeight = false, // Force minimum screen height
      paddingBottom, // custom bottom padding
      header = null,
      useChildMargin = false,
      ...props
    },
    ref
  ) => {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef(null);
    
    // Filter out isFirstCard from props to prevent React warning
    const { isFirstCard, ...domProps } = props;

    // Count number of child elements to enable responsive tweaks (flatten fragments)
    const childCount = React.Children.toArray(children).length;
    
    // Compute top padding – default to header height + 20px when a page header is present.
    // Falls back to 20px when --header-height is unset.
    const computedPaddingTop =
      paddingTop !== undefined ? paddingTop : 'calc(var(--header-height, 0px) + 20px)';

    const style = {
      gap,
      rowGap: gap,
      paddingTop: computedPaddingTop,
      paddingBottom: paddingBottom !== undefined ? paddingBottom : 40,
      ...(maxWidth && { maxWidth: `${maxWidth}px` }),
      ...(minWidth && { minWidth: `${minWidth}px` }),
      ...(paddingX !== undefined ? { paddingLeft: paddingX, paddingRight: paddingX } : {}),
      ...(props.style || {}),
    };

    const containerClasses = cn(
      "card-container w-full flex flex-col items-center",
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
          {header && (
            <div className="w-full flex justify-center" style={{ marginBottom: gap }}>
              {header}
            </div>
          )}
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
                className={cn(
                  "w-full flex justify-center"
                )}
                style={{ 
                  touchAction: "none",
                  position: "relative"
                }}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                dragConstraints={containerRef}
                dragElastic={0}
                whileDrag={{ 
                  zIndex: 9999
                }}
              >
                <div className="w-full flex justify-center">
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
                style={{ marginTop: index === 0 ? gap : undefined }}
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
        {header && (
          <div className="w-full flex justify-center" style={{ marginBottom: gap }}>
            {header}
          </div>
        )}
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          return (
            <div
              key={child.key || index}
              className={cn("w-full flex justify-center")}
              style={useChildMargin ? { marginTop: index > 0 ? gap : 0 } : undefined}
            >
              {React.cloneElement(child, {
                ...(() => {
                  const { isFirstCard: _, style: childStyle, ...filteredProps } = child.props;
                  return {
                    ...filteredProps,
                    style: childStyle,
                  };
                })(),
                ...(typeof child.type !== 'string' ? { isFirstCard: index === 0 } : {}),
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
  paddingTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxWidth: PropTypes.number,
  minWidth: PropTypes.number,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["list", "cards"]),
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
  isFirstCard: PropTypes.bool,
  forceMinHeight: PropTypes.bool,
  paddingBottom: PropTypes.number,
  header: PropTypes.node,
};

export default DeckWrapper; 