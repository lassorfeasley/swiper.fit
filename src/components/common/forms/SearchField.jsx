import React from "react";
import PropTypes from "prop-types";

const GoogleSearchIcon = ({ className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="32"
    viewBox="0 0 48 48"
    width="32"
    fill="#4B6584"
    className={className}
    {...props}
  >
    <path d="M31 28h-1.65l-.6-.55q2.05-2.4 2.05-5.45 0-3.35-2.325-5.675Q26.15 14 22.85 14q-3.3 0-5.625 2.325T14.9 22q0 3.3 2.325 5.625T22.85 29.95q3.05 0 5.45-2.05l.55.6V31l7.25 7.25q.4.4.975.4.575 0 .975-.4.4-.4.4-.975 0-.575-.4-.975zm-8.15 0q-2.5 0-4.25-1.75T16.85 22q0-2.5 1.75-4.25T22.85 16q2.5 0 4.25 1.75T28.85 22q0 2.5-1.75 4.25T22.85 28z"/>
  </svg>
);

const SearchField = ({
  value,
  onChange,
  placeholder = "Search",
  icon = <GoogleSearchIcon />,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`flex w-full h-[60px] p-5 justify-end items-center bg-white border-b border-[var(--Black)] ${className}`}
      {...props}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-h2 font-h2 leading-h2 font-space text-black"
        style={{ height: "100%" }}
      />
      {icon}
    </div>
  );
};

SearchField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default SearchField; 