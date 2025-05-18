import { motion, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function SliderTrack({ status = "locked", onComplete }) {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const TRACK_WIDTH = 278;
  const TRACK_HEIGHT = 60;
  const THUMB_WIDTH = 60;
  const THUMB_HEIGHT = 44;
  const TRACK_PADDING = 8;

  const THUMB_TRAVEL = TRACK_WIDTH - THUMB_WIDTH - (TRACK_PADDING * 2);

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
      controls.start({ x: 0 });
    }
  };

  useEffect(() => {
    controls.start({ x: status === "complete" ? THUMB_TRAVEL : 0 });
  }, [status, controls, THUMB_TRAVEL]);

  return (
    <div
      className="relative flex items-center justify-start overflow-hidden"
      style={{
        width: TRACK_WIDTH,
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
          background: status === "complete" ? "#44BD32" : "#F3F3F3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        drag={status === "active" ? "x" : false}
        dragConstraints={{ left: 0, right: THUMB_TRAVEL }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      >
        {status === "locked" && (
          <div className="flex items-center justify-center w-full h-full">
            <FontAwesomeIcon icon={faLock} className="text-gray-400 text-lg" />
          </div>
        )}
        {status === "complete" && (
          <div className="flex items-center justify-center w-full h-full">
            <FontAwesomeIcon 
              icon={faCheck} 
              style={{ 
                color: "white",
                fontSize: "20px",
                width: "20px",
                height: "20px"
              }} 
            />
          </div>
        )}
      </motion.div>
    </div>
  );
} 