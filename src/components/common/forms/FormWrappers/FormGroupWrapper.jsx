import React from 'react';
import PropTypes from 'prop-types';

const FormGroupWrapper = ({ children, className = '', ...props }) => {
  const childrenArray = React.Children.toArray(children);
  return (
    <div
      className={`self-stretch rounded-[8px] bg-neutral-300 border border-neutral-300 flex flex-col items-stretch overflow-hidden ${className}`}
      {...props}
    >
      {childrenArray.map((child, idx) => (
        <div
          key={idx}
          className={`w-full bg-white ${idx < childrenArray.length - 1 ? 'border-b border-neutral-300' : ''}`}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

FormGroupWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FormGroupWrapper; 