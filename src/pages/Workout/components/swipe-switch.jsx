import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Check, Repeat2, Weight, Clock, Loader2 } from "lucide-react";
import React from "react";
import { useActiveWorkout } from "../../../contexts/ActiveWorkoutContext"; // Added missing import for React

// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function SwipeSwitch({ set, onComplete, onClick, className = "" }) {
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
  } = set;
  
  // Use setId or tempId as the unique identifier
  const uniqueSetId = setId || tempId || `unknown-${Math.random()}`;
  
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
  const lastManualSwipeTime = useRef(0);
  const hasManualSwipedThisSession = useRef(false);
  // Flag to skip the very next automatic-complete animation if THIS window just swiped
  const skipAutoCompleteOnce = useRef(false);
  // Local flag to immediately track manual swipes before context updates
  const locallyManuallySwipedRef = useRef(false);
  
  // Get the manually completed tracking from context
  const { markSetManuallyCompleted, isSetManuallyCompleted } = useActiveWorkout();

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
      setThumbTravel(Math.max(THUMB_WIDTH, newThumbTravel));
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
    setSwipedComplete(true);
    
    // Step 1: Animate thumb smoothly to end position
    controls.start({ 
      x: thumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS 
    }, tweenConfig);

    // Step 2: After slide animation completes, expand thumb to fill inner rail area
    const slideDurationMs = tweenConfig.duration * 1000; // 350ms
    const expand1Delay = slideDurationMs + 100; // Small delay after slide
    const expand1DurationMs = tweenConfig.duration * 1000; // 350ms
    setTimeout(() => {
      controls.start({
          x: 0,
          width: getContentWidth(),
          backgroundColor: "#22C55E",
          borderRadius: RAIL_RADIUS
      }, tweenConfig);
    }, expand1Delay);

    // Step 3: After first expansion, expand thumb to fill full rail and collapse padding
    const collapseDelay = expand1Delay + expand1DurationMs + 50; // Short delay
    const collapseDurationMs = 500; // Must match rail's transition duration
    setTimeout(() => {
      setIsPaddingCollapsed(true);
      controls.start({
        x: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 0
      }, { type: 'tween', ease: 'easeInOut', duration: collapseDurationMs / 1000 });
    }, collapseDelay);

    // Step 4: Reset manual swipe flag after animation completes
    const totalAnimationTime = collapseDelay + collapseDurationMs + 100; // Small buffer
    setTimeout(() => {
      setIsManualSwipe(false);
    }, totalAnimationTime);
  }, [controls, thumbTravel, tweenConfig, getContentWidth]);

  // Reset flags when status changes
  useLayoutEffect(() => {
    // We only clear `swipedComplete` and manual-swipe flags if the set becomes editable again (status === 'default').
    // When status moves to 'complete' we keep the flags so the originating window remembers it already animated.
    if (status === "default") {
      setSwipedComplete(false);
      setIsManualSwipe(false);
      locallyManuallySwipedRef.current = false;
      hasManualSwipedThisSession.current = false;
      skipAutoCompleteOnce.current = false;
    }
    // Reset drag detection every status change
    dragMoved.current = false;
  }, [status]);

  // Handle automatic completion with animation
  useLayoutEffect(() => {
    if (status === 'complete' && !swipedComplete && thumbTravel > 0) {
      // If this window just performed a manual swipe, skip this round
      if (skipAutoCompleteOnce.current) {
        skipAutoCompleteOnce.current = false; // Reset for future sets
        return;
      }
      
      // Only trigger animation if this set was NOT manually completed in this session
      // AND was not locally manually swiped (immediate check)
      if (!isSetManuallyCompleted(setId) && !locallyManuallySwipedRef.current) {
        triggerCompleteAnimation();
      }
    }
  }, [status, swipedComplete, thumbTravel, triggerCompleteAnimation, isSetManuallyCompleted, setId]);



  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const travelNeeded = thumbTravel * 0.6;
    if (status === "default" && info.offset.x >= travelNeeded) {
      // Mark this set as manually completed to prevent future animations
      markSetManuallyCompleted(setId);
      
      // Set local flag immediately to prevent animation
      locallyManuallySwipedRef.current = true;
      
      // For manual swipes, just call onComplete immediately - no animation needed
      onCompleteRef.current?.();
    } else {
      // Incomplete: reset thumb
      controls.start({ x: 0, width: THUMB_WIDTH, backgroundColor: "#FFFFFF", borderRadius: THUMB_RADIUS }, tweenConfig);
    }
    
    // Reset drag detection after a short delay to allow for proper interaction detection
    setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  };

  const isDefault = status === "default";
  const isComplete = status === "complete";
  const isVisuallyComplete = isComplete || swipedComplete;

  // Always use left for positioning, animate x (vertical centering via classes)
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
        // Add a small delay to allow drag events to register first
        setTimeout(() => {
          // Only allow onClick if no drag movement was detected and not currently dragging
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
            // Use a higher threshold for drag detection to prevent accidental clicks
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
        {isDefault && !isVisuallyComplete && (set_variant || set_type === 'timed' || typeof reps === 'number' || weight_unit === 'body' || weight > 0) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-12 inline-flex flex-col justify-center items-end gap-1 pointer-events-none">
            {set_variant && (
              <div className="text-right text-neutral-500 text-xs font-bold uppercase leading-3 tracking-wide">
                {set_variant}
              </div>
            )}
            <div className="inline-flex justify-end items-center gap-2">
              {set_type === 'timed' && (
                <div className="flex justify-center items-center gap-0.5">
                  <Clock className="size-4 text-neutral-500" />
                  <div className="text-center text-neutral-500 text-lg font-bold">
                    {duration >= 60 ? formatTime(duration) : `${duration}`}
                  </div>
                </div>
              )}
              {set_type !== 'timed' && typeof reps === 'number' && (
                <div className="flex justify-center items-center gap-0.5">
                  <Repeat2 className="size-4 text-neutral-500" />
                  <div className="text-center text-neutral-500 text-lg font-bold">{reps}</div>
                </div>
              )}
              {weight_unit === 'body' ? (
                <div className="flex justify-center items-center gap-0.5">
                  <Weight className="size-4 text-neutral-500" />
                  <div className="text-center text-neutral-500 text-lg font-bold">BW</div>
                </div>
              ) : (
                <div className="flex justify-center items-center gap-0.5">
                  <Weight className="size-4 text-neutral-500" />
                  <div className="text-center text-neutral-500 text-lg font-bold">{weight || 0}</div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Optimistic update indicator */}
        {isOptimistic && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
} 