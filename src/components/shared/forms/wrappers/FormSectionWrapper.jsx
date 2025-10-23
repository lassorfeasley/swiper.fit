import React from "react";
import { cn } from "@/lib/utils";

const FormSectionWrapper = ({ children, className = "", bordered = true }) => {
  return (
    <div
      className={cn(
        "w-full flex flex-col gap-4 px-4 py-4",
        bordered && "border-b border-neutral-300 last:border-b-0",
        className
      )}
    >
      {children}
    </div>
  );
};

export default FormSectionWrapper; 