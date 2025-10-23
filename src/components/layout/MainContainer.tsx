import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MainContainer: React.FC<MainContainerProps> = ({ children, className = "" }) => (
  <div className={`max-w-xl mx-auto w-full ${className}`}>
    {children}
  </div>
);

export default MainContainer; 