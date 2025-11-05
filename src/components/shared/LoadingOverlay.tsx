import React, { useState, useEffect, useRef } from 'react';

interface LoadingOverlayProps {
  /** Whether the overlay should be visible */
  isLoading: boolean;
  /** The full message to display with typewriter effect */
  message?: string;
  /** Typing speed in milliseconds per character */
  typingSpeed?: number;
  /** Optional icon/vector to display above the text. If not provided, shows Swiper logo */
  icon?: React.ReactNode;
  /** Custom className for the overlay container */
  className?: string;
  /** Delay in milliseconds after animation completes before overlay can be dismissed */
  postAnimationDelay?: number;
}

/**
 * LoadingOverlay component with typewriter animation effect.
 * Displays a full-screen overlay with animated text that types out character by character,
 * with a blinking cursor at the end. Waits for animation to complete plus a delay before allowing dismissal.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Setting things up...",
  typingSpeed = 50,
  icon,
  className = "",
  postAnimationDelay = 200,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [delayComplete, setDelayComplete] = useState(false);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  // Start typing animation when isLoading becomes true
  useEffect(() => {
    console.log('[LoadingOverlay] Effect triggered - isLoading:', isLoading, 'hasStartedTyping:', hasStartedTyping);
    
    if (!isLoading) {
      // Don't start typing if loading is false
      console.log('[LoadingOverlay] Not loading, skipping typing start');
      return;
    }

    // Only start typing once - if we've already started, don't restart
    if (hasStartedTyping || typingIntervalRef.current) {
      console.log('[LoadingOverlay] Already started typing, skipping');
      return;
    }

    console.log('[LoadingOverlay] Starting typing animation');
    
    // Reset and start typing
    setDisplayedText("");
    setShowCursor(true);
    setAnimationComplete(false);
    setDelayComplete(false);
    setIsTypingActive(true);
    setHasStartedTyping(true);
    currentIndexRef.current = 0;

    const fullText = message;

    typingIntervalRef.current = setInterval(() => {
      if (currentIndexRef.current < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
      } else {
        // Typing complete
        console.log('[LoadingOverlay] Typing complete');
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTypingActive(false);
        setAnimationComplete(true);
      }
    }, typingSpeed);

    // Cleanup on unmount only
    return () => {
      // Don't clear here - let typing finish even if isLoading changes
    };
  }, [isLoading, message, typingSpeed, hasStartedTyping]);

  // Cleanup typing interval on unmount only
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  // Handle post-animation delay - start ONLY when isLoading becomes false after animation completes
  useEffect(() => {
    // Only start delay timer when:
    // 1. Typing animation has completed
    // 2. isLoading is now false (page is ready)
    if (!animationComplete || isLoading) {
      return;
    }

    console.log('[LoadingOverlay] Page ready, starting 0.2s delay');

    // Clear any existing delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }

    // Reset delay state
    setDelayComplete(false);

    // Start delay timer
    delayTimeoutRef.current = setTimeout(() => {
      console.log('[LoadingOverlay] Delay complete, hiding overlay');
      setDelayComplete(true);
      delayTimeoutRef.current = null;
    }, postAnimationDelay);

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [animationComplete, isLoading, postAnimationDelay]);

  // Reset when cycle fully completes (typing + delay)
  useEffect(() => {
    if (animationComplete && delayComplete) {
      // Full cycle completed - reset for potential new cycle
      console.log('[LoadingOverlay] Full cycle complete, resetting for next time');
      setHasStartedTyping(false);
      setAnimationComplete(false);
      setDelayComplete(false);
      setIsTypingActive(false);
      setDisplayedText("");
      setShowCursor(false);
    }
  }, [animationComplete, delayComplete]);

  // Determine if overlay should be shown
  // Show if we've started the cycle and it hasn't fully completed (typing + delay)
  // OR if loading is true (before typing starts)
  const cycleInProgress = hasStartedTyping && !delayComplete;
  const shouldShow = isLoading || cycleInProgress;

  console.log('[LoadingOverlay] Render - shouldShow:', shouldShow, 'hasStartedTyping:', hasStartedTyping, 'cycleInProgress:', cycleInProgress, 'isTypingActive:', isTypingActive, 'animationComplete:', animationComplete, 'delayComplete:', delayComplete, 'isLoading:', isLoading);

  if (!shouldShow) {
    console.log('[LoadingOverlay] Hiding overlay');
    return null;
  }

  // Default logomark SVG if no icon provided
  const displayIcon = icon || (
    <svg 
      width="150" 
      height="118" 
      viewBox="0 0 150 118" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="Vector1Stroke"
    >
      <path 
        d="M150 18.4884L51.8733 118L0 69.7754L16.9518 50.5135L51.1207 82.2785L132.259 0L150 18.4884Z" 
        fill="var(--white, white)"
      />
    </svg>
  );

  return (
    <div 
      data-layer="loading-state-overlay"
      className={`LoadingStateOverlay w-screen h-screen left-0 top-0 fixed bg-green-600 inline-flex flex-col justify-center items-center gap-10 ${className}`}
      style={{ zIndex: 9999 }}
    >
      <div data-svg-wrapper data-layer="Vector 1 (Stroke)" className="Vector1Stroke flex items-center justify-center">
        {displayIcon}
      </div>
      
      <div 
        data-layer="Setting things up..." 
        className="SettingThingsUp justify-start text-white text-2xl font-bold font-['Be_Vietnam_Pro'] leading-8 flex items-center"
      >
        {displayedText}
        {showCursor && (
          <span className="inline-block w-0.5 h-6 bg-white ml-1 animate-blink" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;

