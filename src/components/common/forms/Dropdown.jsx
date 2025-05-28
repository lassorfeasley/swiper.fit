import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

const Dropdown = ({ label, options, value, onChange, className = '', children, isOpen: controlledIsOpen, onToggle }) => {
  const [open, setOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined && onToggle;
  const isOpen = isControlled ? controlledIsOpen : open;
  const selected = options ? options.find(opt => opt.value === value) : null;
  const hasChildren = React.Children.count(children) > 0;

  const handleToggle = () => {
    if (isControlled) {
      onToggle();
    } else {
      setOpen(o => !o);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <div
        className="flex items-center w-full bg-white border border-[#DCDDE1] px-4 cursor-pointer"
        style={{ height: '60px', borderRadius: 0 }}
        onClick={handleToggle}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-h2 font-h2 leading-h2 text-[#353942]">
          {options && selected ? selected.label : value || 'example dropdown text'}
        </span>
        <Icon name="arrow_drop_down" size={28} className="text-[#353942]" />
      </div>
      {isOpen && (
        <div className="w-full bg-white border border-[#DCDDE1]" style={{ borderRadius: 0 }}>
          {hasChildren ? (
            children
          ) : options ? (
            options.map(opt => (
              <div
                key={opt.value}
                className={`flex items-center px-4 cursor-pointer hover:bg-[#F2F2F7] ${opt.value === value ? 'font-bold' : ''}`}
                style={{ height: '60px', borderRadius: 0 }}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                role="option"
                aria-selected={opt.value === value}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="flex items-center px-4 text-gray-500" style={{ height: '60px' }}>
              add form fields here
            </div>
          )}
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
};

export default Dropdown; 