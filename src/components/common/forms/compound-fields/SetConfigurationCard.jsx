import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@/components/ui/card';
import NumericInput from '../NumericInput';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { Separator } from '@/src/components/ui/separator';

const SetConfigurationCard = ({
  reps,
  onRepsChange,
  weight,
  onWeightChange,
  unit,
  onUnitChange,
  className = '',
}) => {
  const isBody = unit === 'body';
  return (
    <Card className={`p-4 ${className}`}>
      <NumericInput
        label="Reps"
        value={reps}
        onChange={onRepsChange}
        className="mb-4"
      />
      <Separator className="my-2" />
      <NumericInput
        label="Weight"
        value={isBody ? 'body' : weight}
        onChange={isBody ? () => {} : onWeightChange}
        allowTwoDecimals={true}
        className="mb-2"
        readOnly={isBody}
        incrementing={!isBody}
      />
      <ToggleGroup
        type="single"
        value={unit}
        onValueChange={onUnitChange}
        className="w-full flex rounded-lg overflow-hidden border border-gray-200"
        variant="outline"
      >
        <ToggleGroupItem value="lbs" className="flex-1 text-sm font-medium py-2 rounded-none border-0 focus:z-10 data-[state=on]:bg-gray-100 data-[state=on]:shadow-none data-[state=on]:text-black">lbs</ToggleGroupItem>
        <ToggleGroupItem value="kg" className="flex-1 text-sm font-medium py-2 rounded-none border-0 focus:z-10 data-[state=on]:bg-gray-100 data-[state=on]:shadow-none data-[state=on]:text-black">kg</ToggleGroupItem>
        <ToggleGroupItem value="body" className="flex-1 text-sm font-medium py-2 rounded-none border-0 focus:z-10 data-[state=on]:bg-gray-100 data-[state=on]:shadow-none data-[state=on]:text-black">body</ToggleGroupItem>
      </ToggleGroup>
    </Card>
  );
};

SetConfigurationCard.propTypes = {
  reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onRepsChange: PropTypes.func.isRequired,
  weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onWeightChange: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default SetConfigurationCard; 