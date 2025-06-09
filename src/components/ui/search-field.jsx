import React, { useRef } from 'react';
import PropTypes from 'prop-types';

const SearchField = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  ...props
}) => {
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
        placeholder={placeholder}
        className="w-full h-full bg-transparent text-xl text-black font-['Space_Grotesk'] focus:outline-none"
        autoComplete="off"
      />
    </div>
  );
};

SearchField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchField; 