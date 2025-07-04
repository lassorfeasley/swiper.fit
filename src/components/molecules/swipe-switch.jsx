import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Check, Repeat2, Weight, Clock } from "lucide-react";

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
  } = set;

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

  // Reset swipedComplete when parent status changes
  useLayoutEffect(() => {
    if (status !== "default") {
      setSwipedComplete(false);
    }
    // Reset drag detection when status changes to ensure clean state
    dragMoved.current = false;
  }, [status]);

  // Persist styling for completed sets when status changes to 'complete'
  useLayoutEffect(() => {
    if (status === 'complete') {
      // collapse padding and expand thumb to full rail with green background
      setIsPaddingCollapsed(true);
      controls.set({ x: 0, left: 0 });
      controls.start({
        x: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#22C55E',
        borderRadius: 0,
      }, { type: 'tween', ease: 'easeInOut', duration: 0 });
    }
  }, [status, controls]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const travelNeeded = thumbTravel * 0.6;
    if (status === "default" && info.offset.x >= travelNeeded) {
      setSwipedComplete(true);
      // We defer onComplete until after full animation sequence

      // Step 1: Snap thumb to end
      controls.set({ x: thumbTravel, width: THUMB_WIDTH, backgroundColor: "#22C55E", borderRadius: THUMB_RADIUS });

      // Step 2: After 200ms, expand thumb to fill inner rail area
      const expand1Delay = 200;
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

      // Step 4: After collapse duration, call onComplete
      const finishTime = collapseDelay + collapseDurationMs + 200; // Buffer
      setTimeout(() => {
        onCompleteRef.current?.();
      }, finishTime);
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
      className={`self-stretch h-16 bg-neutral-200 rounded-sm flex flex-col justify-center w-full cursor-pointer ${className}`}
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
        className={`Rail self-stretch flex-1 rounded-[8px] inline-flex items-center justify-end relative overflow-hidden transition-[padding-left,padding-right] duration-500 ease-in-out ${isPaddingCollapsed ? "pl-0 pr-0" : "pl-2 pr-2"}`}
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
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </motion.div>
        {isDefault && !isVisuallyComplete && (set_variant || set_type === 'timed' || typeof reps === 'number' || (weight > 0 && weight_unit !== 'body')) && (
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
              {weight > 0 && weight_unit !== 'body' && (
                <div className="flex justify-center items-center gap-0.5">
                  <Weight className="size-4 text-neutral-500" />
                  <div className="text-center text-neutral-500 text-lg font-bold">{weight}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
