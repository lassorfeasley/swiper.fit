import React, { useState, useRef } from "react";

export const NumericInputWithUnit = ({
  initialNumber = 0,
  unit = "Reps",
  onChange,
}) => {
  const [number, setNumber] = useState(initialNumber);
  const inputRef = useRef(null);
  const [isSelected, setIsSelected] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) {
      setNumber(value);
      if (onChange) {
        onChange(value);
      }
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = (e) => {
    e.target.select();
    setIsSelected(true);
  };

  const handleBlur = () => {
    setIsSelected(false);
  };

  return (
    <div
      className="flex items-center justify-center bg-white rounded cursor-text"
      style={{
        width: "60px",
        backgroundColor: "white",
        padding: "4px 8px",
        borderRadius: "4px",
      }}
      onClick={handleContainerClick}
    >
      <input
        ref={inputRef}
        type="text"
        value={number}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="text-metric font-metric leading-metric text-center text-heading-black flex-1"
        style={{
          backgroundColor: "transparent",
          border: "none",
          width: "auto",
          minWidth: 0,
          cursor: "text",
          outline: "none",
        }}
        maxLength={3}
      />
      <span
        className="text-xs whitespace-nowrap"
        style={{ fontSize: "8px", width: "auto", lineHeight: "16px" }}
        onClick={handleContainerClick}
      >
        {unit}
      </span>
    </div>
  );
};
