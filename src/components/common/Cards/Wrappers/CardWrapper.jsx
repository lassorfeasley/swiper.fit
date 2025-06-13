import React from 'react';
import PropTypes from 'prop-types';
import { Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';

const CardWrapper = ({ 
  children, 
  className = '', 
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
      className={cn('CardWrapper w-full rounded-xl flex flex-col justify-start items-center gap-4 mx-auto', className)}
      style={{ maxWidth: 500, ...(props.style || {}) }}
      {...divProps}
    >
      {cardTitle && (
        <div className="w-full bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{cardTitle}</h3>
        </div>
      )}
      {reorderable ? (
        <Reorder.Group axis="y" values={items} onReorder={onReorder} className="w-full flex flex-col gap-4">
          {React.Children.map(children, (child, idx) =>
            React.isValidElement(child)
              ? (
                  <Reorder.Item
                    key={items[idx]?.id || idx}
                    value={items[idx]}
                    className="w-full"
                  >
                    {child}
                  </Reorder.Item>
                )
              : child
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