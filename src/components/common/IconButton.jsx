import React from 'react';
import { useMaterialSymbol } from '../hooks/useMaterialSymbol'; // (or your custom hook)

export const IconButton = ({ iconName, onClick, ...props }) => {
  const icon = useMaterialSymbol(iconName); // iconName is passed as a prop
  return ( <button onClick={onClick} {...props}> {icon} </button> );
}; 