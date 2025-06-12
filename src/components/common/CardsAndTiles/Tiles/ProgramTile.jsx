import React from 'react';
import PropTypes from 'prop-types';

const ProgramTile = ({ programName, exerciseCount, onClick, className = '' }) => (
  <div
    className={`self-stretch p-5 bg-stone-50 inline-flex flex-col justify-start items-start gap-2 cursor-pointer ${className}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick && onClick(); }}
    data-component="ProgramTile"
  >
    <div className="justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">
      {programName}
    </div>
    <div className="w-36 justify-start text-slate-600 text-xs font-bold font-['Space_Grotesk'] leading-3">
      {String(exerciseCount).padStart(2, '0')} exercises
    </div>
  </div>
);

ProgramTile.propTypes = {
  programName: PropTypes.string.isRequired,
  exerciseCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ProgramTile; 