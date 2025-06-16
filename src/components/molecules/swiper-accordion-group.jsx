import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const SwiperAccordionGroup = ({ className, children }) => {
  return (
    <div
      className={cn(
        "self-stretch bg-white border border-solid border-neutral-300 rounded-[8px] flex flex-col justify-start items-start overflow-hidden",
        className
      )}
    >
      <div className="w-full max-h-[50vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

SwiperAccordionGroup.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default SwiperAccordionGroup; 