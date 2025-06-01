import React from 'react';
import { MdPause, MdPlayArrow, MdClose } from 'react-icons/md';

/**
 * Props:
 * - timer: string (formatted, e.g. '00:00')
 * - isPaused: boolean
 * - onPauseToggle: function
 * - onEnd: function
 */
const ActiveFocusedNavBar = ({ timer, isPaused, onPauseToggle, onEnd }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-600 bg-opacity-90 rounded-2xl flex items-center px-8 py-4 gap-8 z-50 shadow-lg min-w-[340px]">
      {/* Timer with green dot */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
        <span className="text-stone-50 text-xl font-mono">{timer}</span>
      </div>
      {/* Pause/Resume */}
      <button onClick={onPauseToggle} className="flex flex-col items-center text-stone-50 text-lg px-4 focus:outline-none">
        {isPaused ? <MdPlayArrow size={28} /> : <MdPause size={28} />}
        <span className="text-base mt-1">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>
      {/* End */}
      <button onClick={onEnd} className="flex flex-col items-center text-stone-50 text-lg px-4 focus:outline-none">
        <MdClose size={28} />
        <span className="text-base mt-1">End</span>
      </button>
    </nav>
  );
};

export default ActiveFocusedNavBar; 