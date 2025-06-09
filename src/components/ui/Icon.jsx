import React from 'react';
import PropTypes from 'prop-types';

/**
 * Material Symbols Icon component
 * 
 * @param {Object} props
 * @param {string} props.name - The name of the Material Symbol icon (e.g., 'fitness_center')
 * @param {('outlined'|'rounded'|'sharp'|'filled')} [props.variant='outlined'] - The icon variant
 * @param {number|string} [props.size=24] - The size of the icon in pixels
 * @param {number} [props.weight=400] - The weight of the icon (100-700)
 * @param {number} [props.fill=0] - The fill amount (0 or 1)
 * @param {number} [props.grade=0] - The grade (-50 to 200)
 * @param {number} [props.opticalSize=24] - The optical size (20-48)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} props.rest - Additional props to pass to the span element
 */
const Icon = ({
  name,
  variant = 'outlined',
  size = 24,
  weight = 400,
  fill = 0,
  grade = 0,
  opticalSize = 24,
  className = '',
  ...rest
}) => {
  // Validate variant
  const validVariants = ['outlined', 'rounded', 'sharp', 'filled'];
  if (!validVariants.includes(variant)) {
    console.warn(`Invalid variant "${variant}". Using "outlined" instead.`);
    variant = 'outlined';
  }

  // Clamp values to valid ranges
  const clampedWeight = Math.min(Math.max(weight, 100), 700);
  const clampedFill = Math.min(Math.max(fill, 0), 1);
  const clampedGrade = Math.min(Math.max(grade, -50), 200);
  const clampedOpticalSize = Math.min(Math.max(opticalSize, 20), 48);

  return (
    <span
      className={`material-symbols-${variant} ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${clampedFill}, 'wght' ${clampedWeight}, 'GRAD' ${clampedGrade}, 'opsz' ${clampedOpticalSize}`,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...rest}
    >
      {name}
    </span>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['outlined', 'rounded', 'sharp', 'filled']),
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  weight: PropTypes.number,
  fill: PropTypes.number,
  grade: PropTypes.number,
  opticalSize: PropTypes.number,
  className: PropTypes.string,
};

export default Icon; 