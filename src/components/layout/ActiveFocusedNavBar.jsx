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
            className={`Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer${isPaused ? ' NaviconsSelected3 w-14' : ''}`}
            onClick={onPauseToggle}
          >
            {isPaused ? (
              <>
                <div data-svg-wrapper data-layer="play" className="Play relative">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M15 27C18.1826 27 21.2348 25.7357 23.4853 23.4853C25.7357 21.2348 27 18.1826 27 15C27 11.8174 25.7357 8.76516 23.4853 6.51472C21.2348 4.26428 18.1826 3 15 3C11.8174 3 8.76516 4.26428 6.51472 6.51472C4.26428 8.76516 3 11.8174 3 15C3 18.1826 4.26428 21.2348 6.51472 23.4853C8.76516 25.7357 11.8174 27 15 27V27ZM14.3325 10.752C14.1066 10.6013 13.844 10.5147 13.5728 10.5015C13.3015 10.4884 13.0318 10.5491 12.7924 10.6772C12.5529 10.8053 12.3527 10.996 12.2132 11.229C12.0736 11.462 12 11.7284 12 12V18C12 18.2716 12.0736 18.538 12.2132 18.771C12.3527 19.004 12.5529 19.1947 12.7924 19.3228C13.0318 19.4509 13.3015 19.5116 13.5728 19.4985C13.844 19.4853 14.1066 19.3987 14.3325 19.248L18.8325 16.248C19.0379 16.111 19.2064 15.9254 19.3229 15.7077C19.4394 15.49 19.5003 15.2469 19.5003 15C19.5003 14.7531 19.4394 14.51 19.3229 14.2923C19.2064 14.0746 19.0379 13.889 18.8325 13.752L14.3325 10.752V10.752Z" fill="var(--white, white)"/>
                  </svg>
                </div>
                <div data-layer="Resume" className="Resume text-center justify-start text-white text-xs font-bold font-['Space_Grotesk'] leading-3">Resume</div>
              </>
            ) : (
              <>
                <div data-svg-wrapper data-layer="pause" className="Pause relative">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M27 15C27 18.1826 25.7357 21.2348 23.4853 23.4853C21.2348 25.7357 18.1826 27 15 27C11.8174 27 8.76516 25.7357 6.51472 23.4853C4.26428 21.2348 3 18.1826 3 15C3 11.8174 4.26428 8.76516 6.51472 6.51472C8.76516 4.26428 11.8174 3 15 3C18.1826 3 21.2348 4.26428 23.4853 6.51472C25.7357 8.76516 27 11.8174 27 15ZM10.5 12C10.5 11.6022 10.658 11.2206 10.9393 10.9393C11.2206 10.658 11.6022 10.5 12 10.5C12.3978 10.5 12.7794 10.658 13.0607 10.9393C13.342 11.2206 13.5 11.6022 13.5 12V18C13.5 18.3978 13.342 18.7794 13.0607 19.0607C12.7794 19.342 12.3978 19.5 12 19.5C11.6022 19.5 11.2206 19.342 10.9393 19.0607C10.658 18.7794 10.5 18.3978 10.5 18V12ZM18 10.5C17.6022 10.5 17.2206 10.658 16.9393 10.9393C16.658 11.2206 16.5 11.6022 16.5 12V18C16.5 18.3978 16.658 18.7794 16.9393 19.0607C17.2206 19.342 17.6022 19.5 18 19.5C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V12C19.5 11.6022 19.342 11.2206 19.0607 10.9393C18.7794 10.658 18.3978 10.5 18 10.5Z" fill="var(--slate-200, #E5E5E5)"/>
                  </svg>
                </div>
                <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
                  Pause
                </div>
              </>
            )}
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