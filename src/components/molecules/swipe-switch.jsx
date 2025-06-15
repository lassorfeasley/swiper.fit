import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Check, Lock } from 'lucide-react';

export default function SwipeSwitch({ status = "locked", onComplete, duration = 30 }) {
  const controls = useAnimation();
  const trackRef = useRef(null);
  const [thumbTravel, setThumbTravel] = useState(0);
  const [swipedComplete, setSwipedComplete] = useState(false);
  
  // Internal state to manage timed sets
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timer, setTimer] = useState(duration);
  const timerInterval = useRef(null);

  // Use a smooth, non-bouncy tween for all transitions
  const tweenConfig = { type: "tween", ease: "easeInOut", duration: 0.35 };
  const THUMB_WIDTH = 56; // w-14
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8; // p-2 in Tailwind
  const DRAG_COMPLETE_THRESHOLD = 70;

  const updateThumbTravel = () => {
    if (trackRef.current) {
      const railClientWidth = trackRef.current.clientWidth;
      const railTotalHorizontalPadding = RAIL_HORIZONTAL_PADDING_PER_SIDE * 2;
      const railContentAreaWidth = railClientWidth - railTotalHorizontalPadding;
      const newThumbTravel = railContentAreaWidth - THUMB_WIDTH;
      setThumbTravel(Math.max(0, newThumbTravel));
    }
  };

  useEffect(() => {
    updateThumbTravel();
    const handleResize = () => updateThumbTravel();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset swipedComplete when parent status changes
  useEffect(() => {
    if (status !== "active" && status !== "ready-timed-set") {
      setSwipedComplete(false);
    }
    // Start timer automatically when transitioning to counting-down-timed
    if (status === "counting-down-timed" && !isTimerActive) {
      setTimer(duration); // Reset timer to duration when starting countdown
      setIsTimerActive(true);
    }
  }, [status, duration, isTimerActive]);

  useEffect(() => {
    if (status === "complete") {
      // Animate to rightmost, green
      controls.start({ x: thumbTravel, backgroundColor: "#22C55E", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
      setIsTimerActive(false);
    } else if (swipedComplete) {
      // Animate to rightmost, green
      controls.start({ x: thumbTravel, backgroundColor: "#22C55E", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
      setIsTimerActive(false);
    } else {
      // Animate to left, white
      controls.start({ x: 0, backgroundColor: "#FFFFFF", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
    }
  }, [status, thumbTravel, controls, swipedComplete]);

  useEffect(() => {
    // Only run the timer if this component's internal state says so
    if (isTimerActive) {
      if (timerInterval.current) clearInterval(timerInterval.current);
      timerInterval.current = setInterval(() => {
        setTimer(prev => {
          if (prev > 1) return prev - 1;
          
          // When timer hits 0, clear interval and call onComplete
          clearInterval(timerInterval.current);
          if (onComplete) {
            onComplete(); 
          }
          return 0;
        });
      }, 1000);
    } else {
      // Reset timer if it's not active
      setTimer(duration);
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [isTimerActive, duration, onComplete]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDragEnd = (_, info) => {
    if ((status === "active" || status === "ready-timed-set") && info.offset.x >= DRAG_COMPLETE_THRESHOLD && onComplete) {
      if (status !== 'ready-timed-set') {
        setSwipedComplete(true);
      }
      onComplete();
    } else {
      controls.start({ x: 0, transition: tweenConfig });
    }
  };

  const isLocked = status === "locked";
  const isActive = status === "active";
  const isComplete = status === "complete";
  const isReadyTimed = status === "ready-timed-set";
  const isCountingDown = status === "counting-down-timed";

  // Always use left for positioning, animate x
  const thumbStyle = {
    borderRadius: '0.125rem',
    zIndex: 2,
    height: 'calc(100% - 16px)',
    top: 8,
    left: RAIL_HORIZONTAL_PADDING_PER_SIDE
  };

  if (isCountingDown) {
    return (
      <div className="self-stretch bg-neutral-300 rounded-sm inline-flex flex-col justify-start items-start gap-[5px]">
        <div className="Rail self-stretch h-14 p-2.5 inline-flex justify-start items-center gap-2.5 flex-wrap content-center">
          <div className="Thumb flex-1 h-10 p-2.5 bg-white rounded-sm flex justify-center items-center gap-2.5">
            <div className="Lucide size-6 relative overflow-hidden">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2"/>
                  <path d="M12 7V12L15 15" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
            <div className="justify-center text-sm font-normal font-['Space_Grotesk'] leading-tight text-green-600">
              {formatTime(timer)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="self-stretch h-14 bg-neutral-300 rounded-sm inline-flex flex-col justify-center items-start gap-1 w-full">
      <div 
        ref={trackRef} 
        className="Rail self-stretch flex-1 p-2 rounded-[10px] inline-flex items-center relative overflow-hidden min-w-[56px]"
      >
        <motion.div
          className="Thumb w-14 bg-white rounded-sm flex justify-center items-center gap-2.5 absolute"
          style={thumbStyle}
          drag={isActive || isReadyTimed ? "x" : false}
          dragConstraints={thumbTravel > 0 ? { left: 0, right: thumbTravel } : { left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileDrag={{ cursor: "grabbing" }}
          transition={{ ...tweenConfig, backgroundColor: { ...tweenConfig } }}
        >
          <div className="size-7 relative overflow-hidden flex items-center justify-center">
            {isLocked && (
              <Lock className="w-5 h-6 absolute left-[4.50px] top-[3px] text-neutral-300" />
            )}
            {(isComplete || swipedComplete) && (
              <div data-svg-wrapper data-layer="check" className="Check relative flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            {isReadyTimed && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="#A3A3A3" strokeWidth="2"/>
                <path d="M12 7V12L15 15" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {isActive && !isComplete && !swipedComplete && (
              <Check className="w-5 h-[14px] absolute left-[4.52px] top-[7.50px] text-transparent" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 