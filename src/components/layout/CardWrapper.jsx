import React from 'react';

const CardWrapper = ({ children, className = '' }) => {
  return (
    <div
      className={`flex-1 overflow-y-auto w-full ${className}`}
      style={{ paddingTop: 40 }} // Consistent internal top padding for the content
    >
      {children}
    </div>
  );
};

export default CardWrapper; 