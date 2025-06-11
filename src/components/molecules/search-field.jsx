import React, { useRef } from 'react';
import PropTypes from 'prop-types';

const SearchField = React.forwardRef(({
  value,
  onChange,
  placeholder = '',
  className = '',
  customPlaceholder,
  ...props
}, ref) => {
  const inputRef = useRef(null);

  return (
    <div
      className={`w-full h-full bg-white flex items-center ${className}`}
      {...props}
      onClick={() => inputRef.current && inputRef.current.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={customPlaceholder || placeholder}
        className="w-full h-full bg-transparent text-base text-slate-500 font-['Space_Grotesk'] focus:outline-none"
        autoComplete="off"
      />
    </div>
  );
});

SearchField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  customPlaceholder: PropTypes.string,
  className: PropTypes.string,
};

SearchField.displayName = "SearchField";

export default SearchField; 