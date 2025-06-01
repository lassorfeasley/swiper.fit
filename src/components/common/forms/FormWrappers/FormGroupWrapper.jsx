import React from 'react';
import PropTypes from 'prop-types';

const FormGroupWrapper = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`self-stretch rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 bg-white flex flex-col justify-start items-start overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

FormGroupWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FormGroupWrapper; 