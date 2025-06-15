import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';

/**
 * CardPill - Component for displaying a pill format for sets or exercises
 * 
 * Props:
 * - variant: 'sets' | 'exercises' (default: 'sets')
 * - reps, weight, unit: for 'sets' variant
 * - label: for 'exercises' variant (exercise name)
 * - className: string (optional) - Additional CSS classes
 * - onClick: func (optional) - Function to call when the pill is clicked
 * - style: object (optional) - Additional styles to apply to the pill
 * - complete: boolean (optional) - Whether the pill is completed (sets only)
 * - editable: boolean (optional) - Whether the pill is editable (sets only)
 * - onEdit: func (optional) - Function to call when editing is triggered (sets only)
 * - set_type: string (optional) - Type of set ('reps' or 'timed')
 * - timed_set_duration: number (optional) - Duration of timed set in seconds
 */
const CardPill = ({
  variant = 'sets',
  reps,
  weight,
  unit,
  label,
  className = '',
  onClick,
  style,
  complete = false,
  editable = false,
  onEdit,
  set_type = 'reps',
  timed_set_duration,
}) => {
  // Format the weight display based on unit
  const formatWeight = () => {
    if (unit === 'body') return 'body';
    if (weight !== undefined && unit) {
      return `${weight} ${unit}`;
    }
    return weight !== undefined ? `${weight}` : '';
  };

  const formatWeightForTimed = () => {
    if (unit === 'body') return '× body';
    if (weight > 0 && unit) {
      return `× ${weight} ${unit}`;
    }
    return '';
  }

  // Format time as MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Handle click
  const handleClick = (e) => {
    if (editable && onEdit) {
      e.stopPropagation();
      onEdit();
    } else if (onClick) {
      onClick(e);
    }
  };

  // Shared pill classes
  const pillClass = `px-2 py-0.5 rounded-[20px] flex items-center ${complete ? 'bg-slate-200' : 'bg-gray-200'} ${editable ? 'cursor-pointer' : ''} ${className}`.trim();

  if (variant === 'exercises') {
    return (
      <div
        data-layer="Property 1=Exercises"
        className={pillClass}
        style={style}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
      >
        <span className="text-center text-gray-600 text-xs font-semibold font-['Space_Grotesk'] leading-none">
          {label}
        </span>
      </div>
    );
  }

  // Default: sets variant
  return (
    <div
      data-layer={complete ? "Property 1=Complete" : "Property 1=Sets"}
      className={pillClass}
      style={style}
      onClick={handleClick}
      tabIndex={editable || onClick ? 0 : undefined}
      role={editable ? 'button' : (onClick ? 'button' : undefined)}
    >
      {complete && (
        <span data-layer="check" className="Check relative mr-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M11.6949 3.7051C11.8261 3.83637 11.8998 4.01439 11.8998 4.2C11.8998 4.38562 11.8261 4.56363 11.6949 4.6949L6.09488 10.2949C5.96361 10.4261 5.7856 10.4999 5.59998 10.4999C5.41437 10.4999 5.23635 10.4261 5.10508 10.2949L2.30508 7.4949C2.17757 7.36288 2.10701 7.18606 2.10861 7.00252C2.1102 6.81898 2.18382 6.64342 2.31361 6.51363C2.44339 6.38384 2.61896 6.31023 2.8025 6.30863C2.98604 6.30704 3.16286 6.37759 3.29488 6.5051L5.59998 8.8102L10.7051 3.7051C10.8364 3.57387 11.0144 3.50015 11.2 3.50015C11.3856 3.50015 11.5636 3.57387 11.6949 3.7051Z" fill="var(--white, white)"/>
          </svg>
        </span>
      )}
      {set_type === 'timed' && (
        <span data-layer="lucide" className="Lucide size-4 relative overflow-hidden mr-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5.5" stroke="#334155" strokeWidth="1.2"/>
            <path d="M7 4.5V7L8.5 8.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </span>
      )}
      <div 
        data-layer="RepsXWeight" 
        className={`Repsxweight text-center justify-center text-xs font-semibold font-['Space_Grotesk'] leading-none 
          ${complete ? 'text-slate-600' : 'text-gray-600'}`}
      >
        {set_type === 'timed'
          ? `${formatTime(timed_set_duration || 0)} ${formatWeightForTimed()}`
          : `${reps}×${formatWeight()}`}
      </div>
    </div>
  );
};

CardPill.propTypes = {
  variant: PropTypes.oneOf(['sets', 'exercises']),
  reps: PropTypes.number,
  weight: PropTypes.number,
  unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
  label: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  complete: PropTypes.bool,
  editable: PropTypes.bool,
  onEdit: PropTypes.func,
  set_type: PropTypes.string,
  timed_set_duration: PropTypes.number,
};

export default CardPill; 