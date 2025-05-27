import React from 'react';
import PropTypes from 'prop-types';

const FocusForm = ({ children, className = '', contentClassName = '', formPrompt, ...props }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-end w-full align-stretch ${className}`}
      style={{
        display: 'flex',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'flex-end',
        alignSelf: 'stretch',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        position: 'fixed',
        zIndex: 50,
        background: 'rgba(60, 64, 67, 0.85)', // more visible semi-transparent dark overlay
      }}
      {...props}
    >
      <div
        className={`w-full flex flex-col items-start flex-shrink-0 ${contentClassName}`}
        style={{
          padding: '40px 20px',
          gap: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
          flexShrink: 0,
          borderRadius: '12px 12px 0px 0px',
          background: '#F2F2F7',
          boxShadow: 'none',
          margin: 0,
          maxWidth: 'none',
        }}
      >
        {formPrompt && (
          <h1 className="text-h1 font-h1 leading-h1 font-space text-[#23262B] mb-6">{formPrompt}</h1>
        )}
        {children}
      </div>
    </div>
  );
};

FocusForm.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  formPrompt: PropTypes.string,
};

export default FocusForm; 