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
 * - complete: boolean (optional) - Whether the set is completed
 */
const SetPill = ({ reps, weight, unit = 'lbs', className = '', onClick, style, complete = false }) => {
  // Format the weight display based on unit
  const formatWeight = () => {
    if (unit === 'body') return 'body';
    return `${weight} ${unit}`;
  };

  const baseClasses = complete 
    ? "px-1 py-0.5 bg-green-500 rounded-sm inline-flex justify-start items-center gap-1"
    : "px-2 py-1 bg-grey-200 rounded-[4px] inline-flex justify-start items-center w-fit h-fit";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div 
      data-layer={complete ? "Property 1=complete" : "SetPill"}
      className={combinedClasses}
      style={complete ? { ...style } : { backgroundColor: '#e5e7eb', ...style }}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {complete && (
        <div data-layer="check" className="Check relative">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M11.6949 3.7051C11.8261 3.83637 11.8998 4.01439 11.8998 4.2C11.8998 4.38562 11.8261 4.56363 11.6949 4.6949L6.09488 10.2949C5.96361 10.4261 5.7856 10.4999 5.59998 10.4999C5.41437 10.4999 5.23635 10.4261 5.10508 10.2949L2.30508 7.4949C2.17757 7.36288 2.10701 7.18606 2.10861 7.00252C2.1102 6.81898 2.18382 6.64342 2.31361 6.51363C2.44339 6.38384 2.61896 6.31023 2.8025 6.30863C2.98604 6.30704 3.16286 6.37759 3.29488 6.5051L5.59998 8.8102L10.7051 3.7051C10.8364 3.57387 11.0144 3.50015 11.2 3.50015C11.3856 3.50015 11.5636 3.57387 11.6949 3.7051Z" fill="var(--white, white)"/>
          </svg>
        </div>
      )}
      <div 
        data-layer="RepsXWeight" 
        className={`Repsxweight text-center justify-center text-xs font-normal font-['Space_Grotesk'] leading-none whitespace-nowrap ${complete ? 'text-white' : 'text-slate-500'}`}
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
  complete: PropTypes.bool,
};

export default SetPill; 