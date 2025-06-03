import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

const SearchField = ({
  label = 'Search',
  value,
  onChange,
  placeholder = '',
  className = '',
  ...props
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Show label as placeholder if not focused and empty
  const showLabel = !isFocused && !value;

  return (
    <div
      className={`w-full h-14 px-4 py-2.5 bg-white inline-flex justify-end items-center gap-2.5 ${className}`}
      {...props}
      onClick={() => inputRef.current && inputRef.current.focus()}
      tabIndex={-1}
    >
      <div className="flex-1 h-full flex items-center">
        {showLabel ? (
          <span className="text-slate-500 text-xl font-normal font-['Space_Grotesk'] leading-loose cursor-text select-none">
            {label}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xl text-black font-['Space_Grotesk'] leading-loose focus:outline-none"
            autoComplete="off"
          />
        )}
      </div>
      <div className="Search relative flex-shrink-0">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00001C10.4087 6.00001 8.88258 6.63215 7.75736 7.75736C6.63214 8.88258 6 10.4087 6 12C6 13.5913 6.63214 15.1174 7.75736 16.2426C8.88258 17.3679 10.4087 18 12 18C13.5913 18 15.1174 17.3679 16.2426 16.2426C17.3679 15.1174 18 13.5913 18 12C18 10.4087 17.3679 8.88258 16.2426 7.75736C15.1174 6.63215 13.5913 6.00001 12 6.00001ZM3 12C2.99982 10.5836 3.33396 9.18707 3.97526 7.92412C4.61655 6.66116 5.54688 5.5674 6.69059 4.73179C7.8343 3.89618 9.15909 3.34232 10.5572 3.11525C11.9553 2.88819 13.3873 2.99432 14.7367 3.42503C16.0861 3.85574 17.3147 4.59886 18.3227 5.59395C19.3308 6.58904 20.0897 7.808 20.5378 9.1517C20.9859 10.4954 21.1105 11.9259 20.9015 13.3268C20.6925 14.7278 20.1558 16.0596 19.335 17.214L26.5605 24.4395C26.8337 24.7224 26.9849 25.1013 26.9815 25.4946C26.9781 25.8879 26.8203 26.2641 26.5422 26.5422C26.2641 26.8203 25.8879 26.9781 25.4946 26.9815C25.1013 26.9849 24.7224 26.8337 24.4395 26.5605L17.2155 19.3365C15.869 20.2939 14.285 20.8622 12.637 20.9792C10.989 21.0961 9.34061 20.7572 7.87245 19.9995C6.40429 19.2418 5.17303 18.0945 4.31359 16.6835C3.45414 15.2725 2.99968 13.6522 3 12V12Z" fill="#D4D4D4"/>
        </svg>
      </div>
    </div>
  );
};

SearchField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchField; 