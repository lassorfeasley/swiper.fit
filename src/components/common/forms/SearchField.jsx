import React from "react";
import PropTypes from "prop-types";
import Icon from "../Icon";

const SearchField = ({
  value,
  onChange,
  placeholder = "Search",
  icon = <Icon name="search" variant="outlined" size={20} className="text-slate-500" />,
  className = "",
  variant = "standard", // 'filled', 'outlined', or 'standard'
  label,
  id,
  ...props
}) => {
  const baseInputClasses = "block w-full text-sm text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 peer";
  
  const variantClasses = {
    filled: "rounded-t-lg px-2.5 pb-2.5 pt-5 bg-gray-50 border-0 focus:border-blue-600 dark:bg-gray-700 dark:focus:border-blue-500 dark:text-white",
    outlined: "px-2.5 pb-2.5 pt-4 rounded-lg border border-gray-300 focus:border-blue-600 dark:border-gray-600 dark:focus:border-blue-500 dark:text-white",
    standard: "py-2.5 px-0 border-0 focus:border-blue-600 dark:focus:border-blue-500 dark:text-white"
  };

  const baseLabelClasses = "absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform origin-[0] peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-focus:scale-75";
  
  const variantLabelClasses = {
    filled: "top-4 start-2.5 -translate-y-4 peer-focus:-translate-y-4 peer-placeholder-shown:translate-y-0",
    outlined: "top-2 start-1 -translate-y-4 bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:top-2 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
    standard: "top-3 -z-10 -translate-y-6 peer-focus:-translate-y-6 peer-placeholder-shown:translate-y-0 peer-focus:start-0"
  };

  return (
    <div className={`relative ${className}`} {...props}>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`${baseInputClasses} ${variantClasses[variant]}`}
        autoComplete="off"
      />
      {label && (
        <label
          htmlFor={id}
          className={
            `${baseLabelClasses} ${variantLabelClasses[variant]} ` +
            (value ?
              (variant === 'filled' ? ' scale-75 -translate-y-4' : variant === 'outlined' ? ' scale-75 -translate-y-4 top-2 px-2 bg-white dark:bg-gray-900' : ' scale-75 -translate-y-6')
              :
              ''
            )
          }
        >
          {label}
        </label>
      )}
      {icon && (
        <div className="absolute top-1/2 right-5 -translate-y-1/2 flex items-center" style={{height: '100%'}}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      )}
    </div>
  );
};

SearchField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['filled', 'outlined', 'standard']),
  label: PropTypes.string,
  id: PropTypes.string,
};

export default SearchField; 