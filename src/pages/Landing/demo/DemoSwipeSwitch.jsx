import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Check, Repeat2, Weight, Clock, Loader2 } from "lucide-react";
import React from "react";

// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function DemoSwipeSwitch({ set, onComplete, onClick, className = "", demo = false }) {
  const {
    status = "locked",
    reps,
    weight,
    weight_unit,
    set_variant,
    set_type,
    timed_set_duration,
    isOptimistic = false, // New prop for optimistic updates
    id: setId, // Get the set ID
    tempId, // Get the temp ID as fallback
    account_id, // Get the account that completed this set
  } = set;

  // Use routine_set_id as the primary identifier, fallback to setId or tempId
  const uniqueSetId = set.routine_set_id || setId || tempId || `unknown-${Math.random()}`;

  // Animation controls for thumb only
  const controls = useAnimation();
  const trackRef = useRef(null);
  const [thumbTravel, setThumbTravel] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [swipedComplete, setSwipedComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragMoved = useRef(false);
  const dragStartTime = useRef(0);
  const [isPaddingCollapsed, setIsPaddingCollapsed] = useState(false);
  const [isManualSwipe, setIsManualSwipe] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastManualSwipeTime = useRef(0);
  const hasManualSwipedThisSession = useRef(false);
  // Flag to skip the very next automatic-complete animation if THIS window just swiped
  const skipAutoCompleteOnce = useRef(false);
  // Local flag to immediately track manual swipes before context updates
  const locallyManuallySwipedRef = useRef(false);
  // Flag to track if component is mounted
  const isMountedRef = useRef(false);

  // --- REMOVED: useActiveWorkout context and supabase auth ---

  const duration = timed_set_duration || 30;
  const [timer, setTimer] = useState(duration);
  const timerInterval = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Use a smooth, non-bouncy tween for all transitions
  const tweenConfig = { type: "tween", ease: "easeInOut", duration: 0.35 };
  const THUMB_WIDTH = 80; // w-20
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8; // p-2 in Tailwind
  const RAIL_RADIUS = '8px';
  const THUMB_RADIUS = '8px';
  const DRAG_COMPLETE_THRESHOLD = 70;
  const getContentWidth = () => {
    if (!trackWidth || isNaN(trackWidth)) return THUMB_WIDTH;
    return Math.max(THUMB_WIDTH, trackWidth - RAIL_HORIZONTAL_PADDING_PER_SIDE * 2);
  };

  // Helper to display mm:ss for durations >= 60s (used in pill on the right)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const updateThumbTravel = () => {
    if (isDragging) return;
    if (trackRef.current) {
      const railClientWidth = trackRef.current.clientWidth;
      setTrackWidth(railClientWidth);
      const railTotalHorizontalPadding = RAIL_HORIZONTAL_PADDING_PER_SIDE * 2;
      const railContentAreaWidth = railClientWidth - railTotalHorizontalPadding;
      const newThumbTravel = railContentAreaWidth - THUMB_WIDTH;
      const finalThumbTravel = Math.max(THUMB_WIDTH, newThumbTravel);
      setThumbTravel(finalThumbTravel);
    }
  };

  const debouncedUpdateThumbTravel = debounce(updateThumbTravel, 200);

  useEffect(() => {
    updateThumbTravel();
    const handleResize = () => {
      if (!isDragging) debouncedUpdateThumbTravel();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging]);

  // Helper function for the complete animation sequence
  const triggerCompleteAnimation = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    setIsAnimating(true);
    setSwipedComplete(true);
    controls.start({ 
      x: thumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS 
    }, tweenConfig);
    const slideDurationMs = tweenConfig.duration * 1000;
    const expand1Delay = slideDurationMs + 100;
    const expand1DurationMs = tweenConfig.duration * 1000;
    setTimeout(() => {
      if (isMountedRef.current) {
        controls.start({
            x: 0,
            width: getContentWidth(),
            backgroundColor: "#22C55E",
            borderRadius: RAIL_RADIUS
        }, tweenConfig);
      }
    }, expand1Delay);
    const collapseDelay = expand1Delay + expand1DurationMs + 50;
    const collapseDurationMs = 500;
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsPaddingCollapsed(true);
        controls.start({
          x: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#22C55E',
          borderRadius: 0
        }, { type: 'tween', ease: 'easeInOut', duration: collapseDurationMs / 1000 });
      }
    }, collapseDelay);
    const totalAnimationTime = collapseDelay + collapseDurationMs + 100;
    setTimeout(() => {
      setIsManualSwipe(false);
      setIsAnimating(false);
    }, totalAnimationTime);
  }, [controls, thumbTravel, tweenConfig, getContentWidth]);

  useLayoutEffect(() => {
    if (status === "default") {
      setSwipedComplete(false);
      setIsManualSwipe(false);
      setIsAnimating(false);
      locallyManuallySwipedRef.current = false;
      hasManualSwipedThisSession.current = false;
      skipAutoCompleteOnce.current = false;
    }
    dragMoved.current = false;
    if (status === 'complete') {
      setTimeout(() => {
        updateThumbTravel();
      }, 10);
    }
  }, [status]);

  useLayoutEffect(() => {
    if (status === 'complete' && !swipedComplete && !isAnimating) {
      if (skipAutoCompleteOnce.current) {
        skipAutoCompleteOnce.current = false;
        return;
      }
      if (thumbTravel > 0) {
        triggerCompleteAnimation();
      } else {
        setTimeout(() => {
          updateThumbTravel();
        }, 50);
      }
    }
  }, [status, swipedComplete, thumbTravel, triggerCompleteAnimation, isAnimating]);

  useEffect(() => {
    if (status === 'complete' && !swipedComplete && !isAnimating && thumbTravel > 0) {
      triggerCompleteAnimation();
    }
  }, [thumbTravel, status, swipedComplete, isAnimating, triggerCompleteAnimation]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const travelNeeded = thumbTravel * 0.6;
    if (status === "default" && info.offset.x >= travelNeeded) {
      locallyManuallySwipedRef.current = true;
      triggerCompleteAnimation();
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 100);
    } else {
      if (isMountedRef.current) {
        controls.start({ x: 0, width: THUMB_WIDTH, backgroundColor: "#FFFFFF", borderRadius: THUMB_RADIUS }, tweenConfig);
      }
    }
    setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  };

  const isDefault = status === "default";
  const isComplete = status === "complete";
  const isVisuallyComplete = (isComplete && !isAnimating) || swipedComplete;

  const thumbStyle = {
    zIndex: 2,
    height: "48px", // h-12
    left: RAIL_HORIZONTAL_PADDING_PER_SIDE,
    borderRadius: THUMB_RADIUS,
  };

  return (
    <div
      className={`self-stretch h-16 bg-neutral-200 flex flex-col justify-center w-full cursor-pointer ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setTimeout(() => {
          if (!dragMoved.current && !isDragging) {
            onClick?.(e);
          }
        }, 10);
      }}
    >
      <div
        ref={trackRef}
        className={`Rail self-stretch flex-1 inline-flex items-center justify-end relative overflow-hidden transition-[padding-left,padding-right] duration-500 ease-in-out ${isPaddingCollapsed ? "pl-0 pr-0" : "pl-2 pr-2"}`}
      >
        <motion.div
          className="Thumb w-20 bg-white flex justify-center items-center gap-2.5 absolute top-0 bottom-0 my-auto"
          style={thumbStyle}
          drag={!isVisuallyComplete && isDefault ? "x" : false}
          dragElastic={0}
          dragMomentum={false}
          dragConstraints={{ left: 0, right: thumbTravel }}
          onDragStart={() => { 
            setIsDragging(true); 
            dragMoved.current = false;
            dragStartTime.current = Date.now();
          }}
          onDrag={(e, info) => {
            if (Math.abs(info.delta.x) > 5 || Math.abs(info.delta.y) > 5 || Math.abs(info.offset.x) > 10) {
              dragMoved.current = true;
            }
          }}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileDrag={{ cursor: "grabbing" }}
          transition={{ ...tweenConfig, backgroundColor: { ...tweenConfig } }}
        >
          <div className="size-7 relative overflow-hidden flex items-center justify-center">
            {isVisuallyComplete && (
              <div className="Check relative flex items-center justify-center">
                {isOptimistic ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Check className="w-5 h-5 text-white" />
                )}
              </div>
            )}
          </div>
        </motion.div>
        {(set_variant || set_type === 'timed' || typeof reps === 'number' || weight_unit === 'body' || weight > 0) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-12 inline-flex flex-col justify-center items-end gap-1 pointer-events-none">
            {set_variant && (
              <div className="text-right text-xs font-bold uppercase leading-3 tracking-wide text-neutral-500">
                {set_variant}
              </div>
            )}
            <div className="inline-flex justify-end items-center gap-2">
              {set_type === 'timed' && (
                <div className="flex justify-center items-center gap-0.5">
                  <Clock className="size-4 text-neutral-500" />
                  <div className="text-center text-lg font-bold text-neutral-500">
                    {duration >= 60 ? formatTime(duration) : `${duration}`}
                  </div>
                </div>
              )}
              {set_type !== 'timed' && typeof reps === 'number' && (
                <div className="flex justify-center items-center gap-0.5">
                  <Repeat2 className="size-4 text-neutral-500" />
                  <div className="text-center text-lg font-bold text-neutral-500">{reps}</div>
                </div>
              )}
              {weight_unit === 'body' ? (
                <div className="flex justify-center items-center gap-0.5">
                  <Weight className="size-4 text-neutral-500" />
                  <div className="text-center text-lg font-bold text-neutral-500">BW</div>
                </div>
              ) : (
                <div className="flex justify-center items-center gap-0.5">
                  <Weight className="size-4 text-neutral-500" />
                  <div className="text-center text-lg font-bold text-neutral-500">{weight || 0}</div>
                </div>
              )}
            </div>
          </div>
        )}
        {isOptimistic && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
} 