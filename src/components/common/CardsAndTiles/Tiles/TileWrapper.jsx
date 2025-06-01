// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=250-2788&t=PMJ4ZuE0fteVwbKG-4


import React from 'react';
import PropTypes from 'prop-types';

/**
 * TileWrapper - A scrollable wrapper for tiles with 4px vertical spacing, 200px bottom padding, no margin, and no other padding.
 *
 * Props:
 * - children: React.ReactNode
 * - className: string (optional)
 */
const TileWrapper = ({ children, className = '' }) => (
  <div
    className={`flex flex-col gap-1 overflow-y-auto pb-[200px] m-0 bg-stone-50 ${className}`}
    style={{ padding: 0 }}
    data-component="TileWrapper"
  >
    {children}
  </div>
);

TileWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default TileWrapper; 