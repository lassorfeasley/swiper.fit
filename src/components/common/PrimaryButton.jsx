import React from 'react';
import PropTypes from 'prop-types';

const PrimaryButton = ({
  children,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses =
    'w-full px-6 py-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-6 overflow-hidden';
  const enabledClasses = 'bg-teal-600 cursor-pointer';
  const disabledClasses = 'bg-stone-50 cursor-not-allowed';
  const textEnabled = 'text-white';
  const textDisabled = 'text-slate-600';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`Button ${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${className}`}
      {...props}
    >
      <div
        className={`AddAnotherExercise flex-1 text-center justify-start text-xl font-normal font-['Space_Grotesk'] leading-loose ${
          disabled ? textDisabled : textEnabled
        }`}
      >
        {children}
      </div>
    </button>
  );
};

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
};

export default PrimaryButton; 