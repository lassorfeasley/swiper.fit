import React from "react";
import { MdArrowBack } from "react-icons/md";

export const BackIcon = ({ className = "", onClick }) => (
  <button
    onClick={onClick}
    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
    aria-label="Back"
    type="button"
  >
    <MdArrowBack className={className} />
  </button>
);

export default BackIcon; 