import React from "react";
import { MdAdd } from "react-icons/md";

export const ActionIcon = ({ className = "", icon: IconComponent }) => (
  IconComponent ? <IconComponent className={className} /> : <MdAdd className={className} />
);

export default ActionIcon; 