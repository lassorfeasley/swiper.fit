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

const CardWrapper = ({
  children,
  className = "",
  cardTitle,
  reorderable = false,
  items = [],
  onReorder = () => {},
  headerRef,
  ...props
}) => {
  const divProps = { ...props };
  delete divProps.reorderable;
  delete divProps.items;
  delete divProps.onReorder;
  delete divProps.headerRef;

  return (
    <div
      className={cn(
        "CardWrapper w-full rounded-xl flex flex-col justify-start items-center gap-4 mx-auto overflow-hidden",
        className
      )}
      style={{ maxWidth: 500, ...(props.style || {}) }}
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
          className="w-full flex flex-col gap-4"
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
};

CardWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  cardTitle: PropTypes.string,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
  headerRef: PropTypes.object,
};

export default CardWrapper;
