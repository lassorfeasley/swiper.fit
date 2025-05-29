import React from 'react';
import PropTypes from 'prop-types';

const ProgramCard = ({ programName, exerciseCount, onClick, className = '' }) => (
  <div
    className={`flex flex-col items-start gap-[10px] mb-[12px] cursor-pointer w-full ${className}`}
    style={{
      padding: 20,
      borderRadius: 4,
      background: '#fff',
    }}
    onClick={onClick}
    data-component="ProgramCard"
  >
    <div
      className="flex w-full justify-between items-center"
      style={{ alignSelf: 'stretch' }}
    >
      <h1 className="text-h1 font-h1 leading-h1 font-space text-[#353942] m-0">
        {programName}
      </h1>
      <span className="material-symbols-outlined text-3xl text-[#5A6B7A]">settings</span>
    </div>
    <div className="text-metric font-metric leading-metric text-[#5A6B7A]">
      {String(exerciseCount).padStart(2, '0')} exercises
    </div>
  </div>
);

ProgramCard.propTypes = {
  programName: PropTypes.string.isRequired,
  exerciseCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ProgramCard; 