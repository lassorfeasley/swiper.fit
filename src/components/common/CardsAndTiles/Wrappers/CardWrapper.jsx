import React from 'react';
import PropTypes from 'prop-types';

const CardWrapper = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`CardWrapper self-stretch w-full rounded-xl inline-flex flex-col justify-start items-start gap-[1px] overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

CardWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default CardWrapper; 