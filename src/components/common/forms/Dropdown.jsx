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
  isOpen: controlledIsOpen,
  onToggle,
  children,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined && onToggle;
  const isOpen = isControlled ? controlledIsOpen : open;

  const handleToggle = () => {
    if (isControlled) {
      onToggle();
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <div data-layer="DropdownField" className={`Dropdownfield w-full rounded-sm inline-flex flex-col justify-start items-start gap-1 overflow-hidden ${className}`}>
      <button
        data-layer="Dropdown"
        onClick={handleToggle}
        className="Dropdown w-full px-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-between items-center"
      >
        <div data-layer="SetNumber" className="Setnumber justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">
          {label}
        </div>
        <div data-svg-wrapper data-layer="chevron-down" className={`ChevronDown relative transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.93955 10.9395C8.22084 10.6583 8.6023 10.5003 9.00005 10.5003C9.39779 10.5003 9.77925 10.6583 10.0605 10.9395L15 15.879L19.9395 10.9395C20.0779 10.7962 20.2434 10.682 20.4264 10.6033C20.6094 10.5247 20.8063 10.4834 21.0054 10.4816C21.2046 10.4799 21.4021 10.5178 21.5865 10.5933C21.7708 10.6687 21.9383 10.7801 22.0791 10.9209C22.22 11.0617 22.3314 11.2292 22.4068 11.4136C22.4822 11.5979 22.5202 11.7954 22.5184 11.9946C22.5167 12.1938 22.4753 12.3906 22.3967 12.5736C22.3181 12.7566 22.2038 12.9221 22.0605 13.0605L16.0605 19.0605C15.7793 19.3417 15.3978 19.4997 15 19.4997C14.6023 19.4997 14.2208 19.3417 13.9395 19.0605L7.93955 13.0605C7.65834 12.7792 7.50037 12.3977 7.50037 12C7.50037 11.6023 7.65834 11.2208 7.93955 10.9395V10.9395Z" fill="#3F3F46"/>
          </svg>
        </div>
      </button>
      {isOpen && (
        <div data-layer="Frame 40" className="Frame40 w-full rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  label: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
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