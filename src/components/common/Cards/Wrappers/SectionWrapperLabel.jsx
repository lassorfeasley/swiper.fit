import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

/**
 * SectionWrapperLabel – customizable label/header area for PageSectionWrapper.
 * Renders the title/content inside styled containers for proper spacing and typography.
 */
const SectionWrapperLabel = ({ children, className = "", ...props }) => {
  return (
    <div
      className={cn(
        "h-20 self-stretch px-5 py-7 bg-white border-b border-neutral-300 inline-flex flex-col justify-center items-start gap-2.5",
        className
      )}
      {...props}
    >
      <div className="self-stretch inline-flex justify-center items-center gap-2.5">
        <div className="flex-1 justify-start text-neutral-700 text-2xl font-bold font-vietnam leading-normal">
          {children}
        </div>
      </div>
    </div>
  );
};

SectionWrapperLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default SectionWrapperLabel; 