import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Check, Repeat2, Weight, Clock, Loader2 } from "lucide-react";
import React from "react";
import { useActiveWorkout } from "../../../contexts/ActiveWorkoutContext";
import { supabase } from "../../../supabaseClient";

// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function SwipeSwitch({ set, onComplete, onClick, className = "", demo = false }) {
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
  
  // Get the manually completed tracking from context
  const { markSetManuallyCompleted, isSetManuallyCompleted } = useActiveWorkout();

  // Get authenticated user ID for comparison - always use the actual authenticated user, not the acting user
  const [authenticatedUserId, setAuthenticatedUserId] = useState(null);
  
  useEffect(() => {
    const getAuthenticatedUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthenticatedUserId(user?.id);

    };
    getAuthenticatedUser();
  }, []);

  const duration = timed_set_duration || 30;
  const [timer, setTimer] = useState(duration);
  const timerInterval = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Use a smooth, non-bouncy tween for all transitions
  const tweenConfig = { type: "tween", ease: "easeInOut", duration: 0.35 };
  const THUMB_WIDTH = 80; // w-20
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8; // p-2 in Tailwind
  const RAIL_RADIUS = '12px';
  const THUMB_RADIUS = '12px';
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
    // Check if component is mounted before starting animation
    if (!isMountedRef.current) {
      return;
    }
    
    // Set animating state to true
    setIsAnimating(true);
    
    // Set swipedComplete immediately to trigger the animation
    setSwipedComplete(true);
    
    // Step 1: Animate thumb smoothly to end position
    controls.start({ 
      x: thumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS 
    }, tweenConfig);

    // Step 2: After slide completes, expand to fill content area
    const slideDurationMs = tweenConfig.duration * 1000;
    const expandDelay = slideDurationMs + 50;
    
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // First expand within the padded area
      controls.start({
        x: 0,
        width: getContentWidth(),
        backgroundColor: '#22C55E',
        borderRadius: THUMB_RADIUS
      }, tweenConfig).then(() => {
        // Then expand to full rail dimensions (width and height together)
        controls.start({
          left: -RAIL_HORIZONTAL_PADDING_PER_SIDE,
          width: `calc(100% + ${RAIL_HORIZONTAL_PADDING_PER_SIDE * 2}px)`,
          height: '100%',
          backgroundColor: '#22C55E',
          borderRadius: THUMB_RADIUS
        }, { type: 'tween', ease: 'easeInOut', duration: 0.4 }).then(() => {
          setTimeout(() => {
            setIsManualSwipe(false);
            setIsAnimating(false);
          }, 100);
        });
      });
    }, expandDelay);
  }, [controls, thumbTravel, tweenConfig, getContentWidth]);

  // Reset flags when status changes
  useLayoutEffect(() => {
    // We only clear `swipedComplete` and manual-swipe flags if the set becomes editable again (status === 'default').
    // When status moves to 'complete' we keep the flags so the originating window remembers it already animated.
    if (status === "default") {
      setSwipedComplete(false);
      setIsManualSwipe(false);
      setIsAnimating(false);
      locallyManuallySwipedRef.current = false;
      hasManualSwipedThisSession.current = false;
      skipAutoCompleteOnce.current = false;
    }
    // Reset drag detection every status change
    dragMoved.current = false;
    
    // Update thumb travel when status changes to ensure we have the correct values for animation
    if (status === 'complete') {
      // Use a small delay to ensure the component is fully rendered
      setTimeout(() => {
        updateThumbTravel();
      }, 10);
    }
  }, [status]);

  // Handle automatic completion with animation
  useLayoutEffect(() => {
    if (status === 'complete' && !swipedComplete && !isAnimating) {
      // If this window just performed a manual swipe, skip this round
      if (skipAutoCompleteOnce.current) {
        skipAutoCompleteOnce.current = false; // Reset for future sets
        return;
      }
      
      // Check if this set was manually completed in this session (cache the result)
      const wasManuallyCompleted = isSetManuallyCompleted(uniqueSetId);
      const wasLocallySwiped = locallyManuallySwipedRef.current;
      
      // Only trigger animation if this is a remote completion (not initiated by this window)
      if (!wasManuallyCompleted && !wasLocallySwiped) {
        // Ensure we have a valid thumbTravel value before triggering animation
        if (thumbTravel > 0) {
          triggerCompleteAnimation();
        } else {
          // If thumbTravel is not ready, try again after a short delay
          setTimeout(() => {
            updateThumbTravel();
          }, 50);
        }
      }
    }
  }, [status, swipedComplete, thumbTravel, triggerCompleteAnimation, isSetManuallyCompleted, uniqueSetId, isAnimating]);

  // Additional effect to handle animation when thumbTravel becomes available
  useEffect(() => {
    if (status === 'complete' && !swipedComplete && !isAnimating && thumbTravel > 0) {
      // Check if this set was manually completed in this session
      const wasManuallyCompleted = isSetManuallyCompleted(uniqueSetId);
      const wasLocallySwiped = locallyManuallySwipedRef.current;
      
      // Only trigger animation if this is a remote completion (not initiated by this window)
      if (!wasManuallyCompleted && !wasLocallySwiped) {
        triggerCompleteAnimation();
      }
    }
  }, [thumbTravel, status, swipedComplete, isAnimating, triggerCompleteAnimation, isSetManuallyCompleted, uniqueSetId]);



  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Set mounted flag
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

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const travelNeeded = thumbTravel * 0.6;
    if (status === "default" && info.offset.x >= travelNeeded) {
      // Mark this set as manually completed to prevent future animations (only in non-demo mode)
      if (!demo) {
        markSetManuallyCompleted(uniqueSetId);
      }
      
      // Set local flag immediately to prevent animation
      locallyManuallySwipedRef.current = true;
      
      // Trigger the completion animation immediately for manual swipes
      triggerCompleteAnimation();
      
      // Call onComplete after a short delay to allow animation to start
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 100);
    } else {
      // Incomplete: reset thumb
      if (isMountedRef.current) {
        controls.start({ x: 0, width: THUMB_WIDTH, backgroundColor: "#FFFFFF", borderRadius: THUMB_RADIUS }, tweenConfig);
      }
    }
    
    // Reset drag detection after a short delay to allow for proper interaction detection
    setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  };

  const isDefault = status === "default";
  const isComplete = status === "complete";
  // Show visually complete if:
  // 1. The set was manually completed in this session (isSetManuallyCompleted) - this is the most reliable
  // 2. We've manually swiped (locallyManuallySwipedRef.current) - fallback for immediate state
  // 3. The status is complete and we're not animating (for remote completions)
  // 4. We've set swipedComplete (for manual swipes that are in progress)
  // In demo mode, only use status and animation state, not manual completion tracking
  const isVisuallyComplete = demo 
    ? (isComplete && !isAnimating) || swipedComplete
    : isSetManuallyCompleted(uniqueSetId) || locallyManuallySwipedRef.current || (isComplete && !isAnimating) || swipedComplete;
  






  // Always use left for positioning, animate x (vertical centering via classes)
  const thumbStyle = {
    zIndex: 2,
    height: "48px", // h-12
    left: RAIL_HORIZONTAL_PADDING_PER_SIDE,
    borderRadius: THUMB_RADIUS,
  };

  return (
    <div
      className={`Swipeswitch self-stretch inline-flex flex-col items-start gap-2 w-full cursor-pointer ${className}`}
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
        <div className="SetOne self-stretch justify-center text-neutral-neutral-400 text-xs font-medium uppercase leading-3 tracking-wide">
          {set_variant}
        </div>
      )}
      <div className="Swipeswitch self-stretch bg-neutral-neutral-400 rounded-xl flex flex-col justify-center overflow-hidden">
        <div className="Swipeswitch self-stretch bg-neutral-neutral-200 flex flex-col justify-start items-start">
          <div
            ref={trackRef}
            className={"Rail self-stretch p-2 inline-flex justify-between items-center flex-nowrap relative overflow-hidden"}
            style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
          >
          {/* Left spacer to align with draggable thumb */}
          <div style={{ width: THUMB_WIDTH, height: 48 }} />

          {/* Draggable Thumb */}
          <motion.div
            className="Thumb w-20 h-12 p-2.5 bg-white rounded-xl flex justify-center items-center gap-2.5 absolute top-0 bottom-0 my-auto"
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
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Check className="w-10 h-10 text-white" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
          {/* Absolute overlay for text so it doesn't shift */}
          {(set_variant || set_type === 'timed' || typeof reps === 'number' || weight_unit === 'body' || weight > 0) && (
            <div className="absolute inset-0 flex justify-end items-center pointer-events-none px-2" style={{ zIndex: 1 }}>
              <div className="Cardpill h-12 flex items-center gap-4">
                <div className="Frame1 flex justify-center items-baseline gap-0.5">
                  {set_type === 'timed' ? (
                    <>
                      <Clock className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                      <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-4xl font-black leading-9">
                        {duration >= 60 ? formatTime(duration) : `${duration}`}
                      </div>
                    </>
                  ) : (
                    <>
                      <Repeat2 className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                      <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-4xl font-black leading-9">{typeof reps === 'number' ? reps : ''}</div>
                    </>
                  )}
                </div>
                <div className="Frame2 flex justify-center items-baseline gap-0.5">
                  <Weight className="size-4 text-neutral-neutral-500 relative -top-0.5" />
                  <div className="Repsxweight whitespace-nowrap flex-none text-neutral-neutral-500 text-4xl font-black leading-9">{weight_unit === 'body' ? 'BW' : (weight || 0)}</div>
                </div>
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
      </div>
    </div>
  );
} 