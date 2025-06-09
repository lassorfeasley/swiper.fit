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
  ...props 
}) => {
  const divProps = { ...props };
  delete divProps.reorderable;
  delete divProps.items;
  delete divProps.onReorder;

  return (
    <div
      className={`CardWrapper self-stretch w-full rounded-xl flex flex-col justify-start items-start gap-[5px] p-[10px] ${className}`}
      {...divProps}
    >
      {cardTitle && (
        <div className="w-full px-4 py-2 bg-gray-50 border-b border-gray-200">
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
};

export default CardWrapper; 