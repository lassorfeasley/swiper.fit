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

export default function DemoSwipeSwitch({ set, onComplete, onUndo, onClick, className = "", demo = false }) {
  // Constants
  const THUMB_WIDTH = 80;
  const RAIL_HORIZONTAL_PADDING_PER_SIDE = 8;
  const RAIL_RADIUS = '5px';
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
  const onUndoRef = useRef(onUndo);
  
  // Add stability tracking like the real component
  const [trackWidth, setTrackWidth] = useState(0);
  const [trackHeight, setTrackHeight] = useState(0);
  
  // Stable drag constraints using refs
  const dragConstraintsRef = useRef({ left: 0, right: 0 });
  const thumbTravelRef = useRef(0);
  
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [swipedComplete, setSwipedComplete] = useState(false);
  const [isPaddingCollapsed, setIsPaddingCollapsed] = useState(false);
  const [isManualSwipe, setIsManualSwipe] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCheckVisible, setIsCheckVisible] = useState(false);
  const [finalScaleX, setFinalScaleX] = useState(1);
  const [finalScaleY, setFinalScaleY] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Drag tracking refs
  const dragMoved = useRef(false);
  const dragStartTime = useRef(0);
  const locallyManuallySwipedRef = useRef(false);
  const hasManualSwipedThisSession = useRef(false);
  const skipAutoCompleteOnce = useRef(false);
  const lastManualSwipeTime = useRef(0);
  const prevStatusRef = useRef(status);

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
    const total = Math.max(0, Math.floor(secs || 0));
    const hNum = Math.floor(total / 3600);
    const mNum = Math.floor((total % 3600) / 60);
    const m = mNum.toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    if (hNum > 0) {
      const h = String(hNum).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }
    if (mNum === 0) return `:${s}`;
    return `${mNum}:${s}`;
  };

  // Production-stable thumb travel calculation (pattern from working real component)
  const updateThumbTravel = useCallback(() => {
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
    setIsCheckVisible(false);
    
    const currentThumbTravel = thumbTravelRef.current;
    
    // Step 1: Slide to end position
    controls.start({ 
      x: currentThumbTravel, 
      width: THUMB_WIDTH, 
      backgroundColor: "#22C55E", 
      borderRadius: THUMB_RADIUS,
      scaleX: 1,
      scaleY: 1,
    }, tweenConfig).then(() => {
      if (!isMountedRef.current) return;
      
      // Step 2: Expand to full content width (within padding)
      controls.start({
        x: 0,
        width: getContentWidth(),
        backgroundColor: '#22C55E',
        borderRadius: THUMB_RADIUS,
        scaleX: 1,
        scaleY: 1,
      }, tweenConfig).then(() => {
        if (!isMountedRef.current) return;
        
        // Step 3: Expand outward to cover all padding using transforms to avoid layout jump
        const contentWidth = getContentWidth();
        const targetScaleX = contentWidth > 0 ? (trackWidth || 0) / contentWidth : 1;
        const targetScaleY = (trackHeight || 0) / 48; // Fill rail height while icon is hidden
        setFinalScaleX(targetScaleX || 1);
        setFinalScaleY(targetScaleY || 1);

        controls.start({
          x: 0,
          width: contentWidth,
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          backgroundColor: '#22C55E',
          borderRadius: RAIL_RADIUS
        }, { 
          type: 'tween', 
          ease: 'easeOut',
          duration: 0.35
        }).then(() => {
          setTimeout(() => {
            setIsManualSwipe(false);
            setIsAnimating(false);
            setIsCheckVisible(true);
          }, 100);
        });
      });
    });

  }, [controls, tweenConfig, getContentWidth, isInitialized]);

  // Reverse animation sequence for undo
  const triggerReverseAnimation = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsAnimating(true);
    setIsCheckVisible(false);

    // Ensure travel values are up to date
    updateThumbTravel();

    const contentWidth = getContentWidth();

    // Step 1: dissolve check and re-add margins by shrinking scale from full padding coverage back to content width
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
      const currentThumbTravel = thumbTravelRef.current;
      controls.start({
        x: currentThumbTravel,
        width: THUMB_WIDTH,
        backgroundColor: '#22C55E',
        borderRadius: THUMB_RADIUS,
        scaleX: 1,
        scaleY: 1,
      }, tweenConfig).then(() => {
        if (!isMountedRef.current) return;

        // Step 3: swipe thumb back to the left and return to white
        controls.start({
          x: 0,
          width: THUMB_WIDTH,
          backgroundColor: '#FFFFFF',
          borderRadius: THUMB_RADIUS,
          scaleX: 1,
          scaleY: 1,
        }, tweenConfig).then(() => {
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
        });
      });
    });
  }, [controls, tweenConfig, getContentWidth, updateThumbTravel]);

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
          borderRadius: THUMB_RADIUS,
          scaleX: 1,
          scaleY: 1,
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
    onUndoRef.current = onUndo;
  }, [onUndo]);

  useEffect(() => {
    isMountedRef.current = true;
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
      setIsCheckVisible(false);
      setFinalScaleX(1);
      setFinalScaleY(1);
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

  // Handle reverse animation when status changes from complete to default (undo)
  useLayoutEffect(() => {
    if (prevStatusRef.current === 'complete' && status === 'default' && isVisuallyComplete && !isAnimating) {
      skipAutoCompleteOnce.current = true;
      triggerReverseAnimation();
    }
    
    prevStatusRef.current = status;
  }, [status, isVisuallyComplete, isAnimating, triggerReverseAnimation]);
  
  // Thumb style
  const thumbStyle = {
    zIndex: 2,
    height: "48px",
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
            if (isVisuallyComplete && isComplete) {
              // If completed set is tapped, call onUndo
              onUndoRef.current?.(e);
            } else {
              onClick?.(e);
            }
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
      <div className="Swipeswitch self-stretch flex flex-col justify-center overflow-hidden">
        <div className="Swipeswitch self-stretch h-16 bg-neutral-neutral-200 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-start items-start overflow-hidden">
          <div
            ref={trackRef}
            className={"Rail flex-1 h-16 p-2 flex justify-between items-center flex-wrap content-center relative overflow-hidden"}
            style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain' }}
          >
          {/* Left spacer to align with draggable thumb */}
          <div style={{ width: THUMB_WIDTH, height: 48 }} />

          {/* Absolute, non-interactive overlay for segmented metrics */}
          {((set_type === 'timed') || (typeof reps === 'number' && reps !== 1) || (weight_unit !== 'body')) && (
            <div className="absolute inset-0 flex justify-end items-stretch pointer-events-none" style={{ zIndex: 1 }}>
              {/* Reps/Time segment */}
              {(set_type === 'timed' || (typeof reps === 'number' && reps !== 1)) && (
                <div className="h-full px-4 border-l border-neutral-neutral-300 flex items-center gap-2">
                  {set_type === 'timed' ? (
                    <>
                      <Clock className="size-6 text-neutral-neutral-500" strokeWidth={1} />
                      <span className="text-neutral-neutral-500 text-3xl font-light leading-9">{formatTime(duration)}</span>
                    </>
                  ) : (
                    <>
                      <Repeat2 className="size-6 text-neutral-neutral-500" strokeWidth={1} />
                      <span className="text-neutral-neutral-500 text-3xl font-light leading-9">{typeof reps === 'number' ? reps : ''}</span>
                    </>
                  )}
                </div>
              )}
              {/* Weight segment */}
              {(weight_unit !== 'body') && (
                <div className="h-full px-4 border-l border-neutral-neutral-300 flex items-center gap-2">
                  <Weight className="size-6 text-neutral-neutral-500" strokeWidth={1} />
                  <span className="text-neutral-neutral-500 text-3xl font-light leading-9">{weight || 0}</span>
                </div>
              )}
            </div>
          )}

            {/* Draggable Thumb */}
            <motion.div
            className="Thumb w-20 h-12 p-2.5 bg-white rounded-lg flex justify-center items-center gap-2.5 absolute top-0 bottom-0 my-auto"
            style={{ ...thumbStyle, overflow: 'visible' }}
            drag={!isVisuallyComplete && isDefault ? "x" : false}
            dragElastic={0}
            dragMomentum={false}
            dragConstraints={dragConstraintsRef.current.right > 0 ? dragConstraintsRef.current : { left: 0, right: 0 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={controls}
            whileDrag={{ cursor: "grabbing" }}
            transition={{ ...tweenConfig, backgroundColor: { ...tweenConfig } }}
          >
            <motion.div className="size-6 relative flex items-center justify-center"
              initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
              animate={{ opacity: isCheckVisible ? 1 : 0, scaleX: finalScaleX > 0 ? Math.min(1.2, 1 / finalScaleX) : 1, scaleY: finalScaleY > 0 ? Math.min(1.2, 1 / finalScaleY) : 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ transformOrigin: 'center', zIndex: 3 }}
            >
              {isVisuallyComplete && (
                <div className="Check relative flex items-center justify-center">
                  {isOptimistic ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Check className="w-8 h-8 text-white" />
                  )}
                </div>
              )}
            </motion.div>
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