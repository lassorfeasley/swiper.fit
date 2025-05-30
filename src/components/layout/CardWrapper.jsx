import React, { useRef, useLayoutEffect, useState } from 'react';

const CardWrapper = ({ header, children, className = '' }) => {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [header]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div ref={headerRef} className="flex-shrink-0 z-10">{header}</div>
      <div className="flex-1 overflow-y-auto w-full" style={{ marginTop: headerHeight ? headerHeight + 40 : 40 }}>{children}</div>
    </div>
  );
};

export default CardWrapper; 