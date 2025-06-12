import React from 'react';
import PropTypes from 'prop-types';
import { Reorder } from 'framer-motion';

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
      className={`CardWrapper self-stretch w-full rounded-xl flex flex-col justify-start items-center gap-4 ${className}`}
      {...divProps}
    >
      {cardTitle && (
        <div className="w-full bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{cardTitle}</h3>
        </div>
      )}
      {reorderable ? (
        <Reorder.Group axis="y" values={items} onReorder={onReorder} className="w-full">
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