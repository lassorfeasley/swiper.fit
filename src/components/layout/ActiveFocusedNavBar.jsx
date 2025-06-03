import React from 'react';

/**
 * Props:
 * - timer: string (formatted, e.g. '00:00')
 * - isPaused: boolean
 * - onPauseToggle: function
 * - onEnd: function
 */
const ActiveFocusedNavBar = ({ timer, isPaused, onPauseToggle, onEnd }) => {
  return (
    <div 
      data-layer="ActiveWorkoutNav" 
      className="fixed bottom-0 left-0 w-full h-24 px-6 py-3 bg-black/90 backdrop-blur-[2px] flex justify-center items-start z-50"
    >
      <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper w-80 max-w-80 flex justify-between items-start">
        <div data-layer="Timer" className="Timer flex justify-start items-center gap-1">
          <div data-svg-wrapper data-layer="RecordingIcon" className="Recordingicon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="10" fill="var(--green-500, #22C55E)"/>
            </svg>
          </div>
          <div data-layer="TimePassed" className="Timepassed justify-center text-white text-xl font-normal font-['Space_Grotesk'] leading-loose">
            {timer}
          </div>
        </div>
        <div data-layer="NavIconsWrapper" className="Naviconswrapper flex justify-start items-center">
          <div 
            data-layer="NavIcons" 
            data-selected={!isPaused} 
            className="Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer"
            onClick={onPauseToggle}
          >
            <div data-svg-wrapper data-layer="pause" className="Pause relative">
              {isPaused ? (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M27 15C27 18.1826 25.7357 21.2348 23.4853 23.4853C21.2348 25.7357 18.1826 27 15 27C11.8174 27 8.76516 25.7357 6.51472 23.4853C4.26428 21.2348 3 18.1826 3 15C3 11.8174 4.26428 8.76516 6.51472 6.51472C8.76516 4.26428 11.8174 3 15 3C18.1826 3 21.2348 4.26428 23.4853 6.51472C25.7357 8.76516 27 11.8174 27 15ZM12 10.5C11.6022 10.5 11.2206 10.658 10.9393 10.9393C10.658 11.2206 10.5 11.6022 10.5 12V18C10.5 18.3978 10.658 18.7794 10.9393 19.0607C11.2206 19.342 11.6022 19.5 12 19.5C12.3978 19.5 12.7794 19.342 13.0607 19.0607C13.342 18.7794 13.5 18.3978 13.5 18V12C13.5 11.6022 13.342 11.2206 13.0607 10.9393C12.7794 10.658 12.3978 10.5 12 10.5Z" fill="var(--slate-200, #E5E5E5)"/>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M27 15C27 18.1826 25.7357 21.2348 23.4853 23.4853C21.2348 25.7357 18.1826 27 15 27C11.8174 27 8.76516 25.7357 6.51472 23.4853C4.26428 21.2348 3 18.1826 3 15C3 11.8174 4.26428 8.76516 6.51472 6.51472C8.76516 4.26428 11.8174 3 15 3C18.1826 3 21.2348 4.26428 23.4853 6.51472C25.7357 8.76516 27 11.8174 27 15ZM10.5 12C10.5 11.6022 10.658 11.2206 10.9393 10.9393C11.2206 10.658 11.6022 10.5 12 10.5C12.3978 10.5 12.7794 10.658 13.0607 10.9393C13.342 11.2206 13.5 11.6022 13.5 12V18C13.5 18.3978 13.342 18.7794 13.0607 19.0607C12.7794 19.342 12.3978 19.5 12 19.5C11.6022 19.5 11.2206 19.342 10.9393 19.0607C10.658 18.7794 10.5 18.3978 10.5 18V12ZM18 10.5C17.6022 10.5 17.2206 10.658 16.9393 10.9393C16.658 11.2206 16.5 11.6022 16.5 12V18C16.5 18.3978 16.658 18.7794 16.9393 19.0607C17.2206 19.342 17.6022 19.5 18 19.5C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V12C19.5 11.6022 19.342 11.2206 19.0607 10.9393C18.7794 10.658 18.3978 10.5 18 10.5Z" fill="var(--slate-200, #E5E5E5)"/>
                </svg>
              )}
            </div>
            <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
              {isPaused ? 'Resume' : 'Pause'}
            </div>
          </div>
          <div 
            data-layer="NavIcons" 
            data-selected="true" 
            className="Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer"
            onClick={onEnd}
          >
            <div data-svg-wrapper data-layer="stop" className="Stop relative">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15 27C18.1826 27 21.2348 25.7357 23.4853 23.4853C25.7357 21.2348 27 18.1826 27 15C27 11.8174 25.7357 8.76516 23.4853 6.51472C21.2348 4.26428 18.1826 3 15 3C11.8174 3 8.76516 4.26428 6.51472 6.51472C4.26428 8.76516 3 11.8174 3 15C3 18.1826 4.26428 21.2348 6.51472 23.4853C8.76516 25.7357 11.8174 27 15 27ZM12 10.5C11.6022 10.5 11.2206 10.658 10.9393 10.9393C10.658 11.2206 10.5 11.6022 10.5 12V18C10.5 18.3978 10.658 18.7794 10.9393 19.0607C11.2206 19.342 11.6022 19.5 12 19.5H18C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V12C19.5 11.6022 19.342 11.2206 19.0607 10.9393C18.7794 10.658 18.3978 10.5 18 10.5H12Z" fill="var(--slate-200, #E5E5E5)"/>
              </svg>
            </div>
            <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
              End
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveFocusedNavBar; 