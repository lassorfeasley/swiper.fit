import React from "react";

const MainContainer = ({ children, className = "" }) => (
  <div className={`max-w-xl mx-auto w-full ${className}`}>
    {children}
  </div>
);

export default MainContainer; 