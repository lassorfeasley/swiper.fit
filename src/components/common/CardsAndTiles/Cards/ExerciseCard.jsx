import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reorder } from 'framer-motion';

const ExerciseCard = ({
  // Common props
  exerciseName,
  mode = 'default', // 'default' | 'completed'
  className = '',
  
  // Default mode props
  onEdit,
  isReorderable = false,
  setConfigs = [],
  
  // Completed mode props
  sets = 0,
  reps = 0,
  weight = 0,
  unit = 'lbs',
}) => {
  // Common card wrapper
  const CardWrapper = ({ children }) => {
    if (isReorderable) {
      return (
        <Reorder.Item value={exerciseName} className="w-full">
          {children}
        </Reorder.Item>
      );
    }
    return children;
  };

  // Completed mode render
  if (mode === 'completed') {
    return (
      <CardWrapper>
        <Card className={`px-3 py-2 bg-white rounded-lg flex flex-col justify-start items-start gap-2 ${className}`}>
          <CardTitle className="text-xl font-normal font-['Space_Grotesk'] leading-loose text-slate-600">
            {exerciseName}
          </CardTitle>
          <div className="text-xs font-normal font-['Space_Grotesk'] leading-none text-slate-600">
            {sets === 1 ? 'One set' : sets === 2 ? 'Two sets' : sets === 3 ? 'Three sets' : `${sets} sets`}
          </div>
          <div className="text-sm font-normal font-['Space_Grotesk'] leading-none text-slate-600">
            {`${reps}×${weight} ${unit}`}
          </div>
        </Card>
      </CardWrapper>
    );
  }

  // Default mode render
  return (
    <CardWrapper>
      <Card className={`px-3 py-2 bg-white rounded-lg flex flex-col justify-start items-start gap-5 ${className}`}>
        <div className="self-stretch inline-flex justify-start items-center gap-2">
          <CardTitle className="flex-1">{exerciseName}</CardTitle>
          {onEdit && (
            <div
              data-svg-wrapper
              data-layer="pencil"
              className="relative cursor-pointer"
              onClick={onEdit}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.586 3.58599C13.7705 3.39497 13.9912 3.24261 14.2352 3.13779C14.4792 3.03297 14.7416 2.9778 15.0072 2.97549C15.2728 2.97319 15.5361 3.02379 15.7819 3.12435C16.0277 3.22491 16.251 3.37342 16.4388 3.5612C16.6266 3.74899 16.7751 3.97229 16.8756 4.21809C16.9762 4.46388 17.0268 4.72724 17.0245 4.9928C17.0222 5.25836 16.967 5.5208 16.8622 5.7648C16.7574 6.00881 16.605 6.2295 16.414 6.41399L15.621 7.20699L12.793 4.37899L13.586 3.58599V3.58599ZM11.379 5.79299L3 14.172V17H5.828L14.208 8.62099L11.378 5.79299H11.379Z"
                  fill="var(--slate-600, #2F3640)"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="self-stretch inline-flex justify-start items-center gap-2 flex-wrap content-center">
          {setConfigs.length > 0 ? (
            setConfigs.map((set, index) => (
              <Badge key={index} className="gap-1">
                <span className="text-center justify-center whitespace-nowrap">
                  {`${set.reps || "0"}×${set.weight || "0"} ${set.unit || "lbs"}`}
                </span>
              </Badge>
            ))
          ) : (
            <div className="text-slate-400 text-xs font-normal font-['Space_Grotesk'] leading-none">
              No sets configured. Click the pencil to edit.
            </div>
          )}
        </div>
      </Card>
    </CardWrapper>
  );
};

ExerciseCard.propTypes = {
  // Common props
  exerciseName: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['default', 'completed']),
  className: PropTypes.string,
  
  // Default mode props
  onEdit: PropTypes.func,
  isReorderable: PropTypes.bool,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string
  })),
  
  // Completed mode props
  sets: PropTypes.number,
  reps: PropTypes.number,
  weight: PropTypes.number,
  unit: PropTypes.string
};

export default ExerciseCard; 