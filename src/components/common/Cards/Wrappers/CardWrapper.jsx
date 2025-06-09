import React from 'react';
import PropTypes from 'prop-types';

const CardWrapper = ({ 
  children, 
  className = '', 
  cardTitle,
  ...props 
}) => {
  return (
    <div
      className={`CardWrapper self-stretch w-full rounded-xl flex flex-col justify-start items-start gap-[1px] overflow-hidden ${className}`}
      {...props}
    >
      {cardTitle && (
        <div className="w-full px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{cardTitle}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

CardWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  cardTitle: PropTypes.string,
};

export default CardWrapper; 