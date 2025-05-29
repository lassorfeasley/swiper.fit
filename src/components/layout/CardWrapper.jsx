import React from 'react';

const CardWrapper = ({ header, children, className = '' }) => (
  <div className={`flex flex-col h-screen w-full ${className}`}>
    <div className="flex-shrink-0 z-10">{header}</div>
    <div className="flex-1 overflow-y-auto w-full pt-[40px]">{children}</div>
  </div>
);

export default CardWrapper; 