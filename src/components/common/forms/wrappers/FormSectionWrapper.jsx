import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const FormSectionWrapper = ({ children, className }) => {
  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {children}
    </div>
  );
};

FormSectionWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FormSectionWrapper; 