// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=62-997&t=PMJ4ZuE0fteVwbKG-4


import React from 'react';
import PropTypes from 'prop-types';
import { Reorder } from 'framer-motion';

const Reorder_Card = ({ value, children, className = '' }) => {
  return (
    <Reorder.Item
      value={value}
      className={`flex items-center rounded-2xl bg-stone-50 p-0 min-h-[80px] relative shadow-sm ${className}`}
      style={{ borderRadius: 12 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
    >
      {/* Reorder sidebar with drag handle */}
      <div className="flex flex-col items-center justify-center h-full py-2 px-2 select-none">
        <div className="cursor-grab text-slate-300 opacity-70 hover:opacity-100">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>drag_handle</span>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 px-2 py-4">{children}</div>
    </Reorder.Item>
  );
};

Reorder_Card.propTypes = {
  value: PropTypes.any.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Reorder_Card; 