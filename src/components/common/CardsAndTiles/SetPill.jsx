import React from 'react';
import PropTypes from 'prop-types';

/**
 * SetPill - Component for displaying a set's reps and weight in a pill format
 * 
 * Props:
 * - reps: number - Number of repetitions
 * - weight: number - Weight value
 * - unit: string - Unit of weight ('kg', 'lbs', or 'body')
 * - className: string (optional) - Additional CSS classes
 * - onClick: func (optional) - Function to call when the pill is clicked
 * - style: object (optional) - Additional styles to apply to the pill
 */
const SetPill = ({ reps, weight, unit = 'lbs', className = '', onClick, style }) => {
  // Format the weight display based on unit
  const formatWeight = () => {
    if (unit === 'body') return 'body';
    return `${weight} ${unit}`;
  };

  const baseClasses = "Setpill size- px-2 py-1 bg-grey-200 rounded-[4px] inline-flex justify-start items-center w-fit h-fit";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div 
      data-layer="SetPill" 
      className={combinedClasses}
      style={{ backgroundColor: '#e5e7eb', ...style }} // Fallback color in case the class isn't working
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div 
        data-layer="RepsXWeight" 
        className="Repsxweight text-center justify-center text-slate-500 text-xs font-normal font-['Space_Grotesk'] leading-none whitespace-nowrap"
      >
        {reps}×{formatWeight()}
      </div>
    </div>
  );
};

SetPill.propTypes = {
  reps: PropTypes.number.isRequired,
  weight: PropTypes.number,
  unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default SetPill; 