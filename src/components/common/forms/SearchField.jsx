import React from "react";
import PropTypes from "prop-types";
import Icon from "../Icon";

const SearchField = ({
  value,
  onChange,
  placeholder = "Search",
  icon = <Icon name="search" variant="outlined" size={28} className="text-[#4B6584]" />,
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