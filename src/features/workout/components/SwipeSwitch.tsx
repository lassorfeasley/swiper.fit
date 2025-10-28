import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { Check, Repeat2, Weight, Clock, Loader2, Lock } from "lucide-react";
import { useActiveWorkout } from "../../../contexts/ActiveWorkoutContext";
import { supabase } from "../../../supabaseClient";

// Debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface SwipeSwitchProps {
  set: any;
  onComplete?: (setId: string, data: any) => void;
  onVisualComplete?: (setId: string) => void;
  onClick?: (setId: string) => void;
  className?: string;
  demo?: boolean;
}

export default function SwipeSwitch({ set, onComplete, onVisualComplete, onClick, className = "", demo = false }: SwipeSwitchProps) {
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
  const [trackHeight, setTrackHeight] = useState(0);
  const [swipedComplete, setSwipedComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragMoved = useRef(false);
  const dragStartTime = useRef(0);
  const [isPaddingCollapsed, setIsPaddingCollapsed] = useState(false);
  const [isManualSwipe, setIsManualSwipe] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCheckVisible, setIsCheckVisible] = useState(false);
  const [finalScaleX, setFinalScaleX] = useState(1);
  const [finalScaleY, setFinalScaleY] = useState(1);
  const lastManualSwipeTime = useRef(0);
  const hasManualSwipedThisSession = useRef(false);
  // Flag to skip the very next automatic-complete animation if THIS window just swiped
  const skipAutoCompleteOnce = useRef(false);
  // Local flag to immediately track manual swipes before context updates
  const locallyManuallySwipedRef = useRef(false);
  // Flag to track if component is mounted
  const isMountedRef = useRef(false);
  
  // Get the manually completed tracking from context
  const { markSetManuallyCompleted, unmarkSetManuallyCompleted, isSetManuallyCompleted, isPaused } = useActiveWorkout();

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
  const onVisualCompleteRef = useRef(onVisualComplete);

  // Use a smooth, non-bouncy tween for all transitions
  const tweenConfig = { type: "tween", ease: "easeInOut", duration: 0.35 };
  const THUMB_WIDTH = 80; // w-20
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8; // p-2 in Tailwind
  const RAIL_RADIUS = '8px'; // Match Tailwind rounded-lg (0.5rem)
  const THUMB_RADIUS = '8px'; // Match Tailwind rounded-lg (0.5rem)
  const DRAG_COMPLETE_THRESHOLD = 70;
  const getContentWidth = () => {
    if (!trackWidth || isNaN(trackWidth)) return THUMB_WIDTH;
    return Math.max(THUMB_WIDTH, trackWidth - RAIL_HORIZONTAL_PADDING_PER_SIDE * 2);
  };

  // Helper to display mm:ss when hours are zero, otherwise HH:MM:SS
  const formatTime = (secs) => {
    const total = Math.max(0, Math.floor(secs || 0));
    const hNum = Math.floor(total / 3600);
    const mNum = Math.floor((total % 3600) / 60);
    const m = mNum.toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    if (hNum > 0) {
      const h = String(hNum).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    // No hours: show ":SS" when minutes are 0; otherwise show M:SS without leading zero
    if (mNum === 0) return `:${s}`;
    return `${mNum}:${s}`;
  };

  const updateThumbTravel = () => {
    if (isDragging) return;
    if (trackRef.current) {
      const railClientWidth = trackRef.current.clientWidth;
      const railClientHeight = trackRef.current.clientHeight;
      setTrackWidth(railClientWidth);
      setTrackHeight(railClientHeight);
      const railTotalHorizontalPadding = RAIL_HORIZONTAL_PADDING_PER_SIDE * 2;
      const railContentAreaWidth = railClientWidth - railTotalHorizontalPadding;
      const newThumbTravel = railContentAreaWidth - THUMB_WIDTH;
      const finalThumbTravel = Math.max(0, newThumbTravel);
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
    setIsCheckVisible(false);
    
    // Set swipedComplete immediately to trigger the animation
    setSwipedComplete(true);
    
    // Step 1: Slide to end position
    controls.start({ 
      x: thumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS,
      scaleX: 1,
      scaleY: 1,
    }, tweenConfig as any).then(() => {
      if (!isMountedRef.current) return;
      
      // Step 2: Expand to full content width (within padding)
      controls.start({
        x: 0,
        width: getContentWidth(),
        backgroundColor: '#22C55E',
        borderRadius: THUMB_RADIUS,
        scaleX: 1,
        scaleY: 1,
      }, tweenConfig as any).then(() => {
        if (!isMountedRef.current) return;
        
        // Step 3: Expand outward to cover all padding using transforms to avoid layout flicker
        const contentWidth = getContentWidth();
        // Ensure we have valid measurements before calculating scales
        const validTrackWidth = trackWidth && trackWidth > 0 ? trackWidth : contentWidth;
        const validTrackHeight = trackHeight && trackHeight > 0 ? trackHeight : 48;
        const targetScaleX = contentWidth > 0 ? validTrackWidth / contentWidth : 1;
        const targetScaleY = validTrackHeight > 0 ? validTrackHeight / 48 : 1;
        // Ensure scale values are reasonable (between 1 and 2)
        const safeScaleX = Math.max(1, Math.min(2, targetScaleX || 1));
        const safeScaleY = Math.max(1, Math.min(2, targetScaleY || 1));
        setFinalScaleX(safeScaleX);
        setFinalScaleY(safeScaleY);

        controls.start({
          x: 0,
          width: contentWidth, // keep width constant and scale to fill padding
          scaleX: safeScaleX,
          scaleY: safeScaleY,
          backgroundColor: '#22C55E',
          borderRadius: RAIL_RADIUS
        }, { 
          type: 'tween', 
          ease: 'easeOut',
          duration: 0.35
        }).then(() => {
          // Ensure component is still mounted and wait for scale animation to fully complete
          if (!isMountedRef.current) return;
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setIsManualSwipe(false);
            setIsAnimating(false);
            setIsCheckVisible(true);
            // Notify parent that the visual completion animation has finished
            onVisualCompleteRef.current?.(set.id);
          }, 150); // Increased from 100ms to 150ms to ensure scale animation completes
        });
      });
    });
  }, [controls, thumbTravel, tweenConfig, getContentWidth]);

  // Helper function for reverse animation when undoing a completed set
  const triggerReverseAnimation = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsAnimating(true);
    setIsCheckVisible(false);

    // Ensure travel values are up to date
    updateThumbTravel();

    const contentWidth = getContentWidth();

    // Step 1: dissolve check (done by setIsCheckVisible(false)) and re-add margins by
    // shrinking scale from full padding coverage back to content width
    controls.start({
      x: 0,
      width: contentWidth,
      backgroundColor: '#22C55E',
      borderRadius: THUMB_RADIUS,
      scaleX: 1,
      scaleY: 1,
    }, { type: 'tween', ease: 'easeOut', duration: 0.25 }).then(() => {
      if (!isMountedRef.current) return;

      // Step 2: shrink thumb while staying on the right side
      controls.start({
        x: thumbTravel,
        width: THUMB_WIDTH,
        backgroundColor: '#22C55E',
        borderRadius: THUMB_RADIUS,
        scaleX: 1,
        scaleY: 1,
      }, tweenConfig as any).then(() => {
        if (!isMountedRef.current) return;

        // Step 3: swipe thumb back to the left and return to white
        controls.start({
          x: 0,
          width: THUMB_WIDTH,
          backgroundColor: '#FFFFFF',
          borderRadius: THUMB_RADIUS,
          scaleX: 1,
          scaleY: 1,
        }, tweenConfig as any).then(() => {
          if (!isMountedRef.current) return;
          setSwipedComplete(false);
          setIsManualSwipe(false);
          setIsAnimating(false);
          setIsCheckVisible(false);
          setFinalScaleX(1);
          setFinalScaleY(1);
          locallyManuallySwipedRef.current = false;
          hasManualSwipedThisSession.current = false;
          skipAutoCompleteOnce.current = false;
          // Clear manual completion cache so future completions animate
          unmarkSetManuallyCompleted?.(uniqueSetId);
        });
      });
    });
  }, [controls, tweenConfig, getContentWidth, unmarkSetManuallyCompleted, uniqueSetId]);

  // Reset/transition handling when status changes (including reverse animation on undo)
  const prevStatusRef = useRef(status);
  useLayoutEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Reset drag detection every status change
    dragMoved.current = false;

    // If we transitioned from complete -> default, play reverse animation
    if (prev === 'complete' && status === 'default') {
      triggerReverseAnimation();
      return;
    }

    // Normal reset when entering default state without needing reverse animation
    // Only reset if we're not currently animating AND this wasn't a manual swipe that's pending DB save
    // This prevents visual glitches when DB save is slow or fails
    if (status === 'default' && !isAnimating && !locallyManuallySwipedRef.current && !isSetManuallyCompleted(uniqueSetId)) {
      setSwipedComplete(false);
      setIsManualSwipe(false);
      setIsAnimating(false);
      setIsCheckVisible(false);
      setFinalScaleX(1);
      setFinalScaleY(1);
      locallyManuallySwipedRef.current = false;
      hasManualSwipedThisSession.current = false;
      skipAutoCompleteOnce.current = false;
    }

    // Update thumb travel when status becomes complete to prepare for potential animations
    if (status === 'complete') {
      setTimeout(() => {
        updateThumbTravel();
      }, 10);
    }
  }, [status, triggerReverseAnimation]);

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

  useEffect(() => {
    onVisualCompleteRef.current = onVisualComplete;
  }, [onVisualComplete]);

  // Set mounted flag
  useEffect(() => {
    isMountedRef.current = true;
    // Set initial thumb position
    controls.set({ 
      x: 0, 
      width: THUMB_WIDTH, 
      backgroundColor: "#FFFFFF", 
      borderRadius: THUMB_RADIUS,
      scaleX: 1,
      scaleY: 1,
    });
    return () => {
      isMountedRef.current = false;
    };
  }, [controls]);

  const handleDragEnd = (_, info) => {
    // Block interactions when paused – immediately reset thumb
    if (isPaused) {
      setIsDragging(false);
      if (isMountedRef.current) {
        controls.start({ x: 0, width: THUMB_WIDTH, backgroundColor: "#FFFFFF", borderRadius: THUMB_RADIUS, scaleX: 1, scaleY: 1 }, tweenConfig as any);
      }
      return;
    }
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
        onCompleteRef.current?.(set.id, { ...set, status: "complete" });
      }, 100);
    } else {
      // Incomplete: reset thumb
      if (isMountedRef.current) {
        controls.start({ x: 0, width: THUMB_WIDTH, backgroundColor: "#FFFFFF", borderRadius: THUMB_RADIUS, scaleX: 1, scaleY: 1 }, tweenConfig as any);
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
        // Allow tapping to open editor for default sets, and undo dialog for completed sets
        if (status === 'default' || status === 'complete') {
          e.stopPropagation();
          setTimeout(() => {
            if (!dragMoved.current && !isDragging) {
              onClick?.(set.id);
            }
          }, 10);
        }
      }}
      style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
    >
      {set_variant && (
        <div className="SetOne self-stretch justify-center text-neutral-neutral-400 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
          {set_variant}
        </div>
      )}
      <div className="Swipeswitch self-stretch bg-neutral-neutral-400 rounded-lg flex flex-col justify-center overflow-hidden">
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
            className="Thumb w-20 h-12 p-2.5 bg-white rounded-lg flex justify-center items-center gap-2.5 absolute top-0 bottom-0 my-auto"
            style={{ ...thumbStyle, pointerEvents: (isVisuallyComplete || isPaused) ? 'none' : 'auto', overflow: 'visible' }}
            drag={!isVisuallyComplete && isDefault && !isPaused ? "x" : false}
            dragElastic={0}
            dragMomentum={false}
            dragConstraints={{ left: 0, right: Math.max(0, thumbTravel) }}
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
            <motion.div className="relative flex items-center justify-center"
              initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
              animate={{
                opacity: isCheckVisible ? 1 : 0,
                // Use a conservative inverse scale to prevent distortion
                // Cap the inverse scale to prevent the checkmark from becoming too large
                scaleX: finalScaleX > 0 ? Math.min(1.2, 1 / finalScaleX) : 1,
                scaleY: finalScaleY > 0 ? Math.min(1.2, 1 / finalScaleY) : 1,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ transformOrigin: 'center', zIndex: 3 }}
            >
              {isVisuallyComplete && (
                <div className="Check relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  {isOptimistic ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Check className="w-8 h-8 text-white" />
                  )}
                </div>
              )}
            </motion.div>
            {/* Lock icon overlay when paused and not complete */}
            {isPaused && !isVisuallyComplete && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
                <Lock className="w-5 h-5 text-neutral-400" />
              </div>
            )}
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
                        {formatTime(duration)}
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