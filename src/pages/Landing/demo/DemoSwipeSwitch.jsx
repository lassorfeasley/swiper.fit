import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
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
  // Constants
  const THUMB_WIDTH = 80;
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8;
  const RAIL_RADIUS = '8px';
  const THUMB_RADIUS = '8px';
  const DRAG_COMPLETE_THRESHOLD = 70;

  // Destructure set properties
  const {
    status = "locked",
    reps,
    weight,
    weight_unit,
    set_variant,
    set_type,
    timed_set_duration,
    isOptimistic = false,
    id: setId,
    tempId,
    account_id,
  } = set;

  const uniqueSetId = set.routine_set_id || setId || tempId || `unknown-${Math.random()}`;

  // Core refs and state
  const controls = useAnimation();
  const trackRef = useRef(null);
  const isMountedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  
  // Add stability tracking like the real component
  const [trackWidth, setTrackWidth] = useState(0);
  
  // Stable drag constraints using refs
  const dragConstraintsRef = useRef({ left: 0, right: 0 });
  const thumbTravelRef = useRef(0);
  
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [swipedComplete, setSwipedComplete] = useState(false);
  const [isPaddingCollapsed, setIsPaddingCollapsed] = useState(false);
  const [isManualSwipe, setIsManualSwipe] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Drag tracking refs
  const dragMoved = useRef(false);
  const dragStartTime = useRef(0);
  const locallyManuallySwipedRef = useRef(false);
  const hasManualSwipedThisSession = useRef(false);
  const skipAutoCompleteOnce = useRef(false);
  const lastManualSwipeTime = useRef(0);

  // Timer state
  const duration = timed_set_duration || 30;
  const [timer, setTimer] = useState(duration);
  const timerInterval = useRef(null);

  // Animation config
  const tweenConfig = { type: "tween", ease: "easeInOut", duration: 0.35 };

  // Helper functions
  const getContentWidth = useCallback(() => {
    if (!trackRef.current) return THUMB_WIDTH;
    const railClientWidth = trackRef.current.clientWidth;
    return Math.max(THUMB_WIDTH, railClientWidth - RAIL_HORIZONTAL_PADDING_PER_SIDE * 2);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Production-stable thumb travel calculation (pattern from working real component)
  const updateThumbTravel = useCallback(() => {
    if (isDragging) return;
    if (trackRef.current) {
      const railClientWidth = trackRef.current.clientWidth;
      setTrackWidth(railClientWidth);
      const railTotalHorizontalPadding = RAIL_HORIZONTAL_PADDING_PER_SIDE * 2;
      const railContentAreaWidth = railClientWidth - railTotalHorizontalPadding;
      const newThumbTravel = railContentAreaWidth - THUMB_WIDTH;
      const finalThumbTravel = Math.max(THUMB_WIDTH, newThumbTravel);
      
      thumbTravelRef.current = finalThumbTravel;
      dragConstraintsRef.current = { left: 0, right: finalThumbTravel };
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [isDragging, isInitialized]);

  const debouncedUpdateThumbTravel = useMemo(
    () => debounce(updateThumbTravel, 200),
    [updateThumbTravel]
  );

  // Complete animation sequence
  const triggerCompleteAnimation = useCallback(() => {
    if (!isMountedRef.current || !isInitialized) return;
    
    setIsAnimating(true);
    setSwipedComplete(true);
    
    const currentThumbTravel = thumbTravelRef.current;
    
    // Step 1: Animate thumb to end position
    controls.start({ 
      x: currentThumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS 
    }, tweenConfig);

    // Step 2: Expand thumb to fill inner rail area
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

    // Step 3: Expand thumb to fill full rail and collapse padding
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

    // Step 4: Reset flags after animation completes
    const totalAnimationTime = collapseDelay + collapseDurationMs + 100;
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsManualSwipe(false);
        setIsAnimating(false);
      }
    }, totalAnimationTime);
  }, [controls, tweenConfig, getContentWidth, isInitialized]);

  // Drag handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    dragMoved.current = false;
    dragStartTime.current = Date.now();
  }, []);

  const handleDrag = useCallback((e, info) => {
    if (Math.abs(info.delta.x) > 5 || Math.abs(info.delta.y) > 5 || Math.abs(info.offset.x) > 10) {
      dragMoved.current = true;
    }
  }, []);

  const handleDragEnd = useCallback((_, info) => {
    setIsDragging(false);
    const travelNeeded = thumbTravelRef.current * 0.6;
    
    if (status === "default" && info.offset.x >= travelNeeded) {
      locallyManuallySwipedRef.current = true;
      triggerCompleteAnimation();
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 100);
    } else {
      // Reset thumb to starting position
      if (isMountedRef.current) {
        controls.start({ 
          x: 0, 
          width: THUMB_WIDTH, 
          backgroundColor: "#FFFFFF", 
          borderRadius: THUMB_RADIUS 
        }, tweenConfig);
      }
    }
    
    setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  }, [status, triggerCompleteAnimation, controls, tweenConfig]);

  // Effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Set initial thumb position
    controls.set({ 
      x: 0, 
      width: THUMB_WIDTH, 
      backgroundColor: "#FFFFFF", 
      borderRadius: THUMB_RADIUS 
    });
    
    return () => {
      isMountedRef.current = false;
    };
  }, [controls]);

  useEffect(() => {
    updateThumbTravel();
    const handleResize = () => {
      if (!isDragging) debouncedUpdateThumbTravel();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging, updateThumbTravel, debouncedUpdateThumbTravel]);

  // Reset flags when status changes
  useLayoutEffect(() => {
    if (status === "default") {
      setSwipedComplete(false);
      setIsManualSwipe(false);
      setIsAnimating(false);
      locallyManuallySwipedRef.current = false;
      hasManualSwipedThisSession.current = false;
      skipAutoCompleteOnce.current = false;
      setIsInitialized(false);
    }
    
    dragMoved.current = false;
    
         if (status === 'complete') {
       setTimeout(() => {
         updateThumbTravel();
       }, 10);
     }
     }, [status, updateThumbTravel]);

  // Handle automatic completion
  useLayoutEffect(() => {
    if (status === 'complete' && !swipedComplete && !isAnimating && isInitialized) {
      if (skipAutoCompleteOnce.current) {
        skipAutoCompleteOnce.current = false;
        return;
      }
      
      if (thumbTravelRef.current > 0) {
        triggerCompleteAnimation();
      } else {
                 setTimeout(() => {
           updateThumbTravel();
         }, 50);
      }
    }
     }, [status, swipedComplete, isAnimating, triggerCompleteAnimation, updateThumbTravel, isInitialized]);

  // Computed values
  const isDefault = status === "default";
  const isComplete = status === "complete";
  const isVisuallyComplete = (isComplete && !isAnimating) || swipedComplete;
  
  // Thumb style
  const thumbStyle = {
    zIndex: 2,
    height: "48px",
    left: RAIL_HORIZONTAL_PADDING_PER_SIDE,
    borderRadius: THUMB_RADIUS,
  };

  return (
    <div
      className={`Swipeswitch self-stretch inline-flex flex-col items-start gap-1 w-full cursor-pointer ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setTimeout(() => {
          if (!dragMoved.current && !isDragging) {
            onClick?.(e);
          }
        }, 10);
      }}
      style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
    >
      {set_variant && (
        <div className="SetOne self-stretch justify-center text-neutral-neutral-400 text-xs font-bold uppercase leading-3 tracking-wide">
          {set_variant}
        </div>
      )}
      <div className="Swipeswitch self-stretch bg-neutral-neutral-400 rounded-xl flex flex-col justify-center overflow-hidden">
        <div className="Swipeswitch self-stretch bg-neutral-neutral-200 flex flex-col justify-start items-start">
          <div
            ref={trackRef}
            className={`Rail self-stretch p-2 inline-flex justify-between items-center flex-wrap content-center relative overflow-hidden transition-[padding-left,padding-right] duration-500 ease-in-out ${isPaddingCollapsed ? "pl-0 pr-0" : "pl-2 pr-2"}`}
            style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
          >
          {/* Left spacer to align with draggable thumb */}
          <div style={{ width: THUMB_WIDTH, height: 48 }} />

          {/* Right content (CardPill) */}
          {(set_variant || set_type === 'timed' || typeof reps === 'number' || weight_unit === 'body' || weight > 0) && (
            <div className="Cardpill flex-1 h-12 min-w-0 flex justify-end items-center gap-5 pointer-events-none">
              <div className="Frame1 flex justify-center items-baseline gap-0.5">
                {set_type === 'timed' ? (
                  <>
                    <Clock className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                    <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-5xl font-black leading-[44px]">
                      {duration >= 60 ? formatTime(duration) : `${duration}`}
                    </div>
                  </>
                ) : (
                  <>
                    <Repeat2 className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                    <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-5xl font-black leading-[44px]">{typeof reps === 'number' ? reps : ''}</div>
                  </>
                )}
              </div>
              <div className="Frame2 flex justify-center items-baseline gap-0.5">
                <Weight className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-5xl font-black leading-[44px]">{weight_unit === 'body' ? 'BW' : (weight || 0)}</div>
              </div>
            </div>
          )}

            {/* Draggable Thumb */}
            <motion.div
            className="Thumb w-20 h-12 p-2.5 bg-white rounded-xl flex justify-center items-center gap-2.5 absolute top-0 bottom-0 my-auto"
            style={thumbStyle}
            drag={!isVisuallyComplete && isDefault ? "x" : false}
            dragElastic={0}
            dragMomentum={false}
            dragConstraints={dragConstraintsRef.current.right > 0 ? dragConstraintsRef.current : { left: 0, right: 80 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
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

            {/* Optimistic update indicator */}
            {isOptimistic && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 