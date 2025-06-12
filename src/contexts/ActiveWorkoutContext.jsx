import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutSummaryData, setWorkoutSummaryData] = useState(null);

  useEffect(() => {
    let timer;
    if (isWorkoutActive && !isPaused) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isWorkoutActive, isPaused]);

  const startWorkout = useCallback((workoutData) => {
    setActiveWorkout(workoutData);
    setIsWorkoutActive(true);
    setElapsedTime(0);
    setIsPaused(false);
    setWorkoutSummaryData(null);
  }, []);

  const prepareForSummary = useCallback((summaryData) => {
    setWorkoutSummaryData(summaryData);
    setIsWorkoutActive(false); // This triggers the navigation effect
  }, []);

  const clearSummaryAndReset = useCallback(() => {
    setWorkoutSummaryData(null);
    setElapsedTime(0);
    setActiveWorkout(null);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  return (
    <ActiveWorkoutContext.Provider 
      value={{ 
        activeWorkout, 
        isWorkoutActive, 
        startWorkout,
        elapsedTime,
        isPaused,
        togglePause,
        workoutSummaryData,
        prepareForSummary,
        clearSummaryAndReset
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
} 