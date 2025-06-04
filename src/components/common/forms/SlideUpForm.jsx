// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=230-5016&t=qLasGdJck7GcZoku-4


import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

const formVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

const RightArrowIcon = ({ isReady }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 4.5L22 12L14.5 19.5L12.75 17.6875L17.1875 13.25H2V10.75H17.1875L12.75 6.3125L14.5 4.5Z" fill={isReady ? '#475569' : '#D4D4D4'} />
  </svg>
);

const SlideUpForm = ({
  children,
  className = '',
  contentClassName = '',
  formPrompt,
  onActionIconClick,
  onOverlayClick,
  isOpen = true,
  isReady = false,
  ...props
}) => {
  // Helper to detect overlay click (not content click)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onOverlayClick) {
      onOverlayClick(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-[9999] flex justify-center items-end w-full h-screen bg-zinc-700/90 backdrop-blur-[3px] ${className}`}
          onClick={handleOverlayClick}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          {...props}
        >
          <motion.div
            className={`w-full flex flex-col items-start p-4 bg-[#F2F2F7] rounded-t-xl gap-3 ${contentClassName}`}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {formPrompt && (
              <div className="w-full flex flex-row items-center justify-between">
                <h1 className="text-xl font-medium font-['Space_Grotesk'] text-slate-600 leading-normal m-0">
                  {formPrompt}
                </h1>
                <button
                  className="size-6 flex items-center justify-center cursor-pointer"
                  onClick={onActionIconClick}
                  aria-label="Action"
                  type="button"
                >
                  <RightArrowIcon isReady={isReady} />
                </button>
              </div>
            )}
            <div className="w-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

SlideUpForm.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  formPrompt: PropTypes.string,
  onActionIconClick: PropTypes.func,
  onOverlayClick: PropTypes.func,
  isOpen: PropTypes.bool,
  isReady: PropTypes.bool,
};

export default SlideUpForm; 