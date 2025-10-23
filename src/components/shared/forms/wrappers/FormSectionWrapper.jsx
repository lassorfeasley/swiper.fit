import React from "react";
import PropTypes from "prop-types";
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

FormSectionWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  bordered: PropTypes.bool,
};

export default FormSectionWrapper; 