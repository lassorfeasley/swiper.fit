import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';

export default function SwipeSwitch({ status = "locked", onComplete }) {
  const controls = useAnimation();
  const trackRef = useRef(null);
  const [thumbTravel, setThumbTravel] = useState(0);
  const [swipedComplete, setSwipedComplete] = useState(false);

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
    if (status !== "active") {
      setSwipedComplete(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "complete") {
      // Animate to rightmost, green
      controls.start({ x: thumbTravel, backgroundColor: "#22C55E", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
    } else if (swipedComplete) {
      // Animate to rightmost, green
      controls.start({ x: thumbTravel, backgroundColor: "#22C55E", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
    } else {
      // Animate to left, white
      controls.start({ x: 0, backgroundColor: "#FFFFFF", transition: { ...tweenConfig, backgroundColor: { ...tweenConfig } } });
    }
  }, [status, thumbTravel, controls, swipedComplete]);

  const handleDragEnd = (_, info) => {
    if (status === "active" && info.offset.x >= DRAG_COMPLETE_THRESHOLD && onComplete) {
      setSwipedComplete(true);
      onComplete();
    } else {
      controls.start({ x: 0, transition: tweenConfig });
    }
  };

  const isLocked = status === "locked";
  const isActive = status === "active";
  const isComplete = status === "complete";

  // Always use left for positioning, animate x
  const thumbStyle = {
    borderRadius: '0.125rem',
    zIndex: 2,
    height: 'calc(100% - 16px)',
    top: 8,
    left: RAIL_HORIZONTAL_PADDING_PER_SIDE
  };

  return (
    <div className="self-stretch h-14 bg-neutral-300 rounded-sm inline-flex flex-col justify-center items-start gap-1 w-full">
      <div 
        ref={trackRef} 
        className="Rail self-stretch flex-1 p-2 rounded-[10px] inline-flex items-center relative overflow-hidden"
      >
        <motion.div
          className="Thumb w-14 bg-white rounded-sm flex justify-center items-center gap-2.5 absolute"
          style={thumbStyle}
          drag={isActive ? "x" : false}
          dragConstraints={thumbTravel > 0 ? { left: 0, right: thumbTravel } : { left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileDrag={{ cursor: "grabbing" }}
          transition={{ ...tweenConfig, backgroundColor: { ...tweenConfig } }}
        >
          <div className="size-7 relative overflow-hidden flex items-center justify-center">
            {isLocked && (
              <LockClosedIcon className="w-5 h-6 absolute left-[4.50px] top-[3px] text-neutral-300" />
            )}
            {(isComplete || swipedComplete) && (
              <div data-svg-wrapper data-layer="check" className="Check relative flex items-center justify-center">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M25.0605 7.93949C25.3417 8.22078 25.4997 8.60224 25.4997 8.99998C25.4997 9.39773 25.3417 9.77919 25.0605 10.0605L13.0605 22.0605C12.7792 22.3417 12.3977 22.4997 12 22.4997C11.6023 22.4997 11.2208 22.3417 10.9395 22.0605L4.9395 16.0605C4.66626 15.7776 4.51507 15.3987 4.51849 15.0054C4.52191 14.6121 4.67966 14.2359 4.95777 13.9578C5.23588 13.6796 5.6121 13.5219 6.0054 13.5185C6.39869 13.5151 6.7776 13.6662 7.0605 13.9395L12 18.879L22.9395 7.93949C23.2208 7.65828 23.6023 7.50031 24 7.50031C24.3977 7.50031 24.7792 7.65828 25.0605 7.93949Z" fill="white"/>
                </svg>
              </div>
            )}
            {isActive && !isComplete && !swipedComplete && (
              <CheckIcon className="w-5 h-[14px] absolute left-[4.52px] top-[7.50px] text-transparent" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 