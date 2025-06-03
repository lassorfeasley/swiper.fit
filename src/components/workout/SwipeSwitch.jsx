import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';

export default function SwipeSwitch({ status = "locked", onComplete }) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const [thumbTravel, setThumbTravel] = useState(0);
  const [forceComplete, setForceComplete] = useState(false);

  const springConfig = { type: "spring", stiffness: 300, damping: 30, mass: 1 };
  const THUMB_WIDTH = 56; // w-14, as per Figma thumb
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8; // Assuming p-2 in Tailwind is 8px
  const DRAG_COMPLETE_THRESHOLD = 70; // Pixels to drag to complete

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
    if (status === "active") {
      updateThumbTravel();
    }
    const handleResize = () => {
      if (status === "active") {
        updateThumbTravel();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status]);

  useEffect(() => {
    if (status !== 'complete' && forceComplete) {
      setForceComplete(false);
    }
  }, [status, forceComplete]);

  const handleDragStart = () => {
    if (status === "active") {
      // Reset forceComplete at the start of a new drag if it wasn't externally completed
      if (status !== 'complete') {
        setForceComplete(false);
      }
      setIsDragging(true);
    }
  };

  const handleDrag = (e, info) => {
    if (status !== "active" || !isDragging || thumbTravel <= 0) return;
    // Check for completion based on fixed pixel threshold
    if (info.offset.x > DRAG_COMPLETE_THRESHOLD) {
      if (!forceComplete) { // Prevent multiple calls if already triggered
        setForceComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleDragEnd = (e, info) => {
    if (status === "active" && isDragging) {
      setIsDragging(false); // Primary place to set isDragging false
      // If forceComplete was not set during the drag, it means threshold wasn't met.
      if (!forceComplete) {
        controls.start({ x: 0, transition: springConfig });
      }
      // If forceComplete IS true, the main animation useEffect will handle moving to completed state.
    }
  };

  useEffect(() => {
    let targetX = 0;
    let newBgColor = "#FFFFFF";

    if (status === "complete" || forceComplete) {
      targetX = thumbTravel;
      newBgColor = "#22C55E";
    } else if (status === "locked") {
      targetX = 0;
    } else { 
      targetX = 0;
    }
    if (thumbTravel >= 0) {
      controls.start({ x: targetX, backgroundColor: newBgColor, transition: { ...springConfig, backgroundColor: { duration: 0.3 } } });
    }
  }, [status, forceComplete, thumbTravel, controls]);

  return (
    <>
      {status === "active" && (
        <div className="Property1Default self-stretch h-14 bg-neutral-300 rounded-sm inline-flex flex-col justify-center items-start gap-1 w-full">
          <div ref={trackRef} className="Rail self-stretch flex-1 p-2 rounded-[10px] inline-flex items-center relative overflow-hidden">
            <motion.div
              className="Thumb w-14 bg-white rounded-sm flex justify-center items-center gap-2.5 absolute"
              style={{ borderRadius: '0.125rem', zIndex: 2, height: 'calc(100% - 16px)', top: 8 }}
              drag="x"
              dragConstraints={thumbTravel > 0 ? { left: 0, right: thumbTravel } : {left: 0, right: 0}}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              animate={controls}
              whileDrag={{ cursor: "grabbing" }}
              transition={{ x: springConfig, backgroundColor: { duration: 0.3 } }}
            >
              {/* Content of thumb for active state - icon can be conditional based on drag/forceComplete if needed */}
              { (forceComplete) ? (
                <div className="Check size-7 relative overflow-hidden flex items-center justify-center">
                   <CheckIcon className="w-5 h-[14px] absolute left-[4.52px] top-[7.50px] text-white" />
                </div>
              ) : (
                <div className="Check size-7 relative overflow-hidden flex items-center justify-center">
                  <CheckIcon className="w-5 h-[14px] absolute left-[4.52px] top-[7.50px] text-transparent" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {(status === "complete" || (status === "active" && forceComplete)) && (
        <div className="Property1Complete self-stretch h-14 bg-neutral-300 rounded-sm inline-flex flex-col justify-center items-start gap-1 w-full">
          <div className="Rail self-stretch flex-1 p-2 rounded-[10px] inline-flex justify-end items-center relative overflow-hidden">
            <div className="Thumb w-14 bg-green-500 rounded-sm flex justify-center items-center gap-2.5 absolute" style={{ height: 'calc(100% - 16px)', top: 8, right: RAIL_HORIZONTAL_PADDING_PER_SIDE }}>
              <div className="Check size-7 relative overflow-hidden flex items-center justify-center">
                <CheckIcon className="w-5 h-[14px] absolute left-[4.52px] top-[7.50px] text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "locked" && !forceComplete && (
        <div className="Property1Locked self-stretch h-14 bg-neutral-300 rounded-sm inline-flex flex-col justify-center items-start gap-[5px] w-full">
          <div className="Rail self-stretch flex-1 p-2 rounded-[10px] inline-flex justify-start items-center relative overflow-hidden">
            <div className="Thumb w-14 bg-white rounded-sm flex justify-center items-center gap-2.5 absolute" style={{ height: 'calc(100% - 16px)', top: 8, left: RAIL_HORIZONTAL_PADDING_PER_SIDE }}>
              <div className="LockClosed size-7 relative overflow-hidden flex items-center justify-center">
                <LockClosedIcon className="w-5 h-6 absolute left-[4.50px] top-[3px] text-neutral-300" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 