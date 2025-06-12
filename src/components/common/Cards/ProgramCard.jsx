import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import CardPill from '@/components/molecules/CardPill';

const ProgramCard = ({ programName, exerciseNames = [], className = '', ...props }) => {
  return (
    <Card className={`w-full max-w-[500px] p-4 bg-white rounded-lg flex flex-col gap-2 cursor-pointer ${className}`} {...props}>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="text-slate-950 text-xl font-medium font-['Space_Grotesk'] leading-normal">
          {programName}
        </div>
        <div className="flex flex-wrap gap-2 content-center">
          {exerciseNames.map((name, idx) => (
            <CardPill
              key={idx}
              variant="exercises"
              label={name}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

ProgramCard.propTypes = {
  programName: PropTypes.string.isRequired,
  exerciseNames: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

export default ProgramCard; 