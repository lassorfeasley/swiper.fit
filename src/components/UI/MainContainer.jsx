import React from "react";

const MainContainer = ({ children, className = "" }) => (
  <div className={`max-w-xl mx-auto p-4 w-full ${className}`}>
    {children}
  </div>
);

export default MainContainer; 