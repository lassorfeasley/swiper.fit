import React from 'react';
import PropTypes from 'prop-types';

const FocusForm = ({ children, className = '', contentClassName = '', formPrompt, actionIcon, onActionIconClick, onOverlayClick, ...props }) => {
  // Helper to detect overlay click (not content click)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onOverlayClick) {
      onOverlayClick(e);
    }
  };
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-end w-full align-stretch h-screen ${className}`}
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
        height: '100vh',
      }}
      onClick={handleOverlayClick}
      {...props}
    >
      <div
        className={`w-full flex flex-col items-start flex-shrink-0 flex-1 min-h-0 ${contentClassName}`}
        style={{
          padding: '40px 20px',
          gap: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
          flexShrink: 0,
          flex: 1,
          minHeight: 0,
          borderRadius: '12px 12px 0px 0px',
          background: '#F2F2F7',
          boxShadow: 'none',
          margin: 0,
          maxWidth: 'none',
        }}
      >
        {formPrompt && (
          <div className="w-full flex flex-row items-center justify-between mb-6">
            <h1 className="text-h1 font-h1 leading-h1 font-space text-[#23262B] m-0">{formPrompt}</h1>
            {actionIcon && (
              <span
                className="ml-4 cursor-pointer flex items-center justify-center"
                onClick={onActionIconClick}
                tabIndex={0}
                role="button"
                aria-label="Action"
              >
                {actionIcon}
              </span>
            )}
          </div>
        )}
        {/* Scrollable container for all form fields except the prompt */}
        <div style={{ maxHeight: '80vh', overflowY: 'auto', width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

FocusForm.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  formPrompt: PropTypes.string,
  actionIcon: PropTypes.node,
  onActionIconClick: PropTypes.func,
  onOverlayClick: PropTypes.func,
};

export default FocusForm; 