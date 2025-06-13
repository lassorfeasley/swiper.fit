import React from 'react';
import PropTypes from 'prop-types';

const ExerciseSetsConfigurationCard = ({
  name,
  sets,
  reps,
  weight,
  unit,
  onSettingsClick,
  dragHandleProps = {},
}) => {
  return (
    <div className="flex items-center bg-[#f5f6fa] rounded-xl p-4 mb-4">
      {/* Drag handle */}
      <div {...dragHandleProps} className="mr-4 cursor-move select-none text-gray-400">
        <span className="material-icons">drag_indicator</span>
      </div>
      {/* Main content */}
      <div className="flex-1">
        <div className="text-xl font-bold text-[#5A6B7A]">{name || '[Exercise name]'}</div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1 bg-white rounded px-3 py-1 text-base font-bold">
            <span>{sets}</span>
            <span className="text-xs font-normal ml-1">SETS</span>
          </div>
          <div className="flex items-center gap-1 bg-white rounded px-3 py-1 text-base font-bold">
            <span>{reps}</span>
            <span className="text-xs font-normal ml-1">REPS</span>
          </div>
          <div className="flex items-center gap-1 bg-white rounded px-3 py-1 text-base font-bold">
            <span>{weight}</span>
            <span className="text-xs font-normal ml-1">{unit?.toUpperCase() || 'LBS'}</span>
          </div>
        </div>
      </div>
      {/* Settings icon */}
      <button onClick={onSettingsClick} className="ml-4 text-[#5A6B7A]">
        <span className="material-icons">settings</span>
      </button>
    </div>
  );
};

ExerciseSetsConfigurationCard.propTypes = {
  name: PropTypes.string,
  sets: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  onSettingsClick: PropTypes.func,
  dragHandleProps: PropTypes.object,
};

export default ExerciseSetsConfigurationCard; 