import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function SwipeSwitch({ status = "locked", onComplete }) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const [thumbTravel, setThumbTravel] = useState(0);

  // Animation spring configuration for more natural movement
  const springConfig = {
    type: "spring",
    stiffness: 300,  // Lower stiffness for less bounciness
    damping: 30,     // Higher damping to reduce oscillation
    mass: 1          // Standard mass
  };

  const TRACK_HEIGHT = 60;
  const THUMB_WIDTH = 60;
  const THUMB_HEIGHT = 44;
  const TRACK_PADDING = 8;

  const updateThumbTravel = () => {
    if (trackRef.current) {
      const trackWidth = trackRef.current.clientWidth - (TRACK_PADDING * 2);
      const newThumbTravel = trackWidth - THUMB_WIDTH;
      setThumbTravel(newThumbTravel);
    }
  };

  useEffect(() => {
    updateThumbTravel();
    
    // Add resize listener to handle container width changes
    const handleResize = () => updateThumbTravel();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [status]); // Re-run when status changes

  const handleDrag = (e, info) => {
    if (status !== "active" || !isDragging) return;
    if (info.offset.x > 100) {
      setIsDragging(false);
      onComplete?.();
    }
  };

  const handleDragStart = () => {
    if (status === "active") setIsDragging(true);
  };

  const handleDragEnd = () => {
    if (status === "active" && isDragging) {
      setIsDragging(false);
      controls.start({ x: 0, transition: springConfig });
    }
  };

  useEffect(() => {
    if (thumbTravel > 0) {
      if (status === "complete") {
        // Animate to the end position with a smoother transition
        controls.start({ 
          x: thumbTravel,
          backgroundColor: "#44BD32",
          transition: {
            ...springConfig,
            backgroundColor: { duration: 0.3 }
          }
        });
      } else {
        controls.start({ 
          x: 0, 
          backgroundColor: "#F3F3F3",
          transition: {
            ...springConfig,
            backgroundColor: { duration: 0.3 }
          }
        });
      }
    }
  }, [status, controls, thumbTravel]);

  return (
    <div
      ref={trackRef}
      className="relative flex items-center justify-start overflow-hidden w-full"
      style={{
        height: TRACK_HEIGHT,
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: TRACK_PADDING,
        boxSizing: "border-box",
        boxShadow: "none",
      }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={status === "complete" ? 100 : 0}
    >
      <motion.div
        className="flex items-center justify-center"
        style={{
          width: THUMB_WIDTH,
          height: THUMB_HEIGHT,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        initial={{ backgroundColor: "#F3F3F3" }}
        drag={status === "active" ? "x" : false}
        dragConstraints={{ left: 0, right: thumbTravel }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileDrag={{ scale: 1.02, cursor: "grabbing" }}
        transition={{
          x: springConfig,
          backgroundColor: { duration: 0.3 }
        }}
      >
        {status === "locked" && (
          <div className="flex items-center justify-center w-full h-full">
            <i className="material-icons" style={{ color: "#666666" }}>lock</i>
          </div>
        )}
        {status === "complete" && (
          <div className="flex items-center justify-center w-full h-full">
            <i className="material-icons" style={{ color: "white" }}>check</i>
          </div>
        )}
      </motion.div>
    </div>
  );
} 