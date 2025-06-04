import React from 'react';
import PropTypes from 'prop-types';
import { Reorder } from 'framer-motion';

const CardWrapper = ({ children, className = '', reorderable = false, items = [], onReorder = () => {} }) => {
  if (reorderable) {
    return (
      <div className={`flex-1 overflow-y-auto w-full mt-px ${className}`} style={{ paddingTop: 20 }}>
        <Reorder.Group axis="y" values={items} onReorder={onReorder} className="flex flex-col gap-4 w-full">
          {children}
        </Reorder.Group>
      </div>
    );
  }
  return (
    <div className={`flex-1 overflow-y-auto w-full mt-px ${className}`} style={{ paddingTop: 20 }}>
      {children}
    </div>
  );
};

CardWrapper.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  reorderable: PropTypes.bool,
  items: PropTypes.array,
  onReorder: PropTypes.func,
};

export default CardWrapper; 