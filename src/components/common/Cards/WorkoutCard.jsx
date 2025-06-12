import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';

const WorkoutCard = ({ workoutName, programName = '', exerciseCount, duration, className = '', ...props }) => {
  return (
    <Card className={`w-full max-w-[500px] p-4 bg-stone-50 rounded-lg flex flex-col gap-2 overflow-hidden cursor-pointer ${className}`} {...props}>
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="w-96 text-slate-950 text-lg font-medium font-['Space_Grotesk'] leading-7 truncate">
          {workoutName}
        </div>
        {programName && (
          <div className="w-96 text-slate-950 text-sm font-normal font-['Space_Grotesk'] leading-tight truncate">
            {programName}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{exerciseCount} exercises</span>
          <span>|</span>
          <span>{duration}</span>
        </div>
      </CardContent>
    </Card>
  );
};

WorkoutCard.propTypes = {
  workoutName: PropTypes.string.isRequired,
  programName: PropTypes.string,
  exerciseCount: PropTypes.number,
  duration: PropTypes.string,
  className: PropTypes.string,
};

export default WorkoutCard; 