// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=132-2406&t=PMJ4ZuE0fteVwbKG-4

import React from 'react';
import PropTypes from 'prop-types';

const MetricPill = ({ values = [], value, unit, className = '', onClick }) => {
  // Normalize values: if values prop is provided, use it, else use [value]
  let displayValues = Array.isArray(values) && values.length ? values : [value];
  displayValues = displayValues.filter(v => v !== undefined && v !== null);
  const uniqueValues = Array.from(new Set(displayValues));
  let showValues = uniqueValues.length > 3 ? [uniqueValues[0]] : uniqueValues;
  if (uniqueValues.length === 1) showValues = [uniqueValues[0]];

  return (
    <div
      className={`bg-stone-50 rounded-sm outline outline-[0.5px] outline-offset-[-0.5px] outline-slate-500 inline-flex justify-center items-end overflow-hidden ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Edit ${unit}` : undefined}
      data-layer="Property 1=Default"
    >
      <div className="self-stretch flex justify-center items-center" data-layer="MetricUnitWrapper">
        <div className="flex justify-start items-center" data-layer="MetricWrapper">
          {showValues.map((val, idx) => (
            <div
              key={idx}
              className={`w-8 h-6 min-w-6 px-1 border-r-[0.5px] border-slate-500 inline-flex flex-col justify-center items-center gap-2.5`}
              data-layer={`Metric${idx+1}Wrapper`}
            >
              <div className="text-center justify-center text-slate-500 text-label" data-layer={`Metric${idx+1}`}>{val}</div>
            </div>
          ))}
        </div>
        <div className="w-11 self-stretch px-2 bg-slate-500 flex justify-center items-center gap-2.5" data-layer="UnitWrapper">
          <div className="text-center justify-center text-stone-50 text-label uppercase" data-layer="Unit">{unit}</div>
        </div>
      </div>
    </div>
  );
};

MetricPill.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  values: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  unit: PropTypes.string.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default MetricPill; 