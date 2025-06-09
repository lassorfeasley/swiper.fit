import React from 'react';
import PropTypes from 'prop-types';

const TileWrapper = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`TileWrapper self-stretch w-full rounded-lg inline-flex flex-col justify-start items-start gap-[1px] overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

TileWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default TileWrapper; 