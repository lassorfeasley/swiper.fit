import React from 'react';
import PropTypes from 'prop-types';

const MetricPill = ({ value, unit, className = '' }) => {
  return (
    <div
      className={`flex items-center px-0 w-full ${className}`}
      style={{ 
        minWidth: 0,
        borderRadius: 4,
        border: '0.5px solid var(--Grey, #DCDDE1)',
        background: 'var(--White, #FFF)',
        height: 24,
      }}
    >
      <span
        className="text-metric font-metric leading-metric"
        style={{
          display: 'flex',
          height: 24,
          padding: '0px 8px',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          borderRight: '0.5px solid var(--Grey, #DCDDE1)',
        }}
      >
        {value}
      </span>
      <span
        className="text-metric-label font-metric-label leading-metric-label text-[#353942]"
        style={{
          display: 'flex',
          padding: '0px 8px',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          flex: '1 0 0',
          alignSelf: 'stretch',
        }}
      >
        {unit}
      </span>
    </div>
  );
};

MetricPill.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default MetricPill; 