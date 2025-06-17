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
  return (
    <div
      className={`w-full h-full bg-white flex items-center ${className}`}
      {...props}
      onClick={() => ref && ref.current && ref.current.focus()}
    >
      <input
        ref={ref}
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