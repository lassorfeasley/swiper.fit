// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=177-1417&t=qLasGdJck7GcZoku-4

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

const NumericField = ({ label, value, onIncrement, onDecrement }) => (
  <div className="w-full h-11 px-0 py-0 bg-white flex justify-between items-center">
    <div className="text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">
      {label}
    </div>
    <div className="flex items-center gap-1">
      <button 
        onClick={onDecrement}
        className="w-6 h-6 flex items-center justify-center rotate-90"
        tabIndex={-1}
        type="button"
      >
        <Icon name="arrow_drop_down" variant="outlined" size={24} className="text-slate-200" />
      </button>
      <span className="text-slate-500 text-xl font-medium font-['Space_Grotesk'] leading-normal w-8 text-center">
        {String(value).padStart(2, '0')}
      </span>
      <button 
        onClick={onIncrement}
        className="w-6 h-6 flex items-center justify-center -rotate-90"
        tabIndex={-1}
        type="button"
      >
        <Icon name="arrow_drop_down" variant="outlined" size={24} className="text-slate-200" />
      </button>
    </div>
  </div>
);

const ToggleButton = ({ label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 h-7 ${
      isSelected 
        ? 'bg-slate-200' 
        : 'bg-stone-50 outline outline-1 outline-offset-[-1px] outline-slate-200'
    } rounded-sm flex justify-center items-center gap-2.5`}
    type="button"
  >
    <span className={`flex-1 text-center text-slate-600 ${isSelected ? 'text-base' : 'text-sm'} font-normal font-['Space_Grotesk'] leading-none`}>
      {label}
    </span>
  </button>
);

const Dropdown = ({ 
  label, 
  options, 
  value, 
  onChange, 
  className = '', 
  children,
  isOpen: controlledIsOpen, 
  onToggle,
  showNumericFields = false,
  numericValues = { reps: 0, weight: 0 },
  onNumericChange,
  unit = 'lbs',
  onUnitChange,
}) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined && onToggle;
  const isOpen = isControlled ? controlledIsOpen : open;
  const selected = options ? options.find(opt => opt.value === value) : null;

  const handleToggle = () => {
    if (isControlled) {
      onToggle();
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <div className={`w-full rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start overflow-hidden ${className}`}>
      <div 
        className="w-full h-11 px-2.5 bg-white flex justify-between items-center cursor-pointer"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">
          {selected ? selected.label : label || 'Set'}
        </div>
        <Icon name={isOpen ? 'arrow_drop_up' : 'arrow_drop_down'} variant="outlined" size={24} className="text-slate-500" />
      </div>
      {isOpen && (
        <div className="w-full flex flex-col justify-start items-start overflow-hidden bg-white">
          {options && (
            <div className="w-full">
              {options.map(opt => (
                <div
                  key={opt.value}
                  className={`h-11 px-2.5 flex items-center cursor-pointer hover:bg-slate-100 ${opt.value === value ? 'bg-slate-100' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    if (!isControlled) setOpen(false);
                  }}
                  role="option"
                  aria-selected={opt.value === value}
                >
                  <span className="text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {showNumericFields && (
            <>
              <NumericField
                label="Reps"
                value={numericValues.reps}
                onIncrement={() => onNumericChange?.('reps', numericValues.reps + 1)}
                onDecrement={() => onNumericChange?.('reps', Math.max(0, numericValues.reps - 1))}
              />
              <NumericField
                label="Weight"
                value={numericValues.weight}
                onIncrement={() => onNumericChange?.('weight', numericValues.weight + 1)}
                onDecrement={() => onNumericChange?.('weight', Math.max(0, numericValues.weight - 1))}
              />
              <div className="w-full px-3 pb-3 flex justify-start items-center gap-3">
                {['lbs', 'kg', 'body'].map((u) => (
                  <ToggleButton
                    key={u}
                    label={u}
                    isSelected={unit === u}
                    onClick={() => onUnitChange?.(u)}
                  />
                ))}
              </div>
            </>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  showNumericFields: PropTypes.bool,
  numericValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
  }),
  onNumericChange: PropTypes.func,
  unit: PropTypes.oneOf(['lbs', 'kg', 'body']),
  onUnitChange: PropTypes.func,
};

NumericField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
};

ToggleButton.propTypes = {
  label: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Dropdown; 