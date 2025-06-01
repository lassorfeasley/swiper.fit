// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1692&t=qLasGdJck7GcZoku-4

import React from "react";
import PropTypes from "prop-types";

const TextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  error,
  id,
  inputRef,
  ...props
}) => {
  return (
    <div
      className={`w-full h-11 px-2.5 py-1 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-center items-start gap-1 ${className}`}
      {...props}
    >
      <div className="justify-start text-slate-500 text-[8px] font-medium font-['Space_Grotesk'] uppercase leading-[8px] tracking-tight">
        {label}
      </div>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ref={inputRef}
        className="w-full bg-transparent text-base text-gray-900 font-['Space_Grotesk'] focus:outline-none"
        autoComplete="off"
      />
    </div>
  );
};

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.bool,
  id: PropTypes.string,
  inputRef: PropTypes.any,
};

export default TextField;