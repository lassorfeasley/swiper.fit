import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutProgress, setWorkoutProgress] = useState({});

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
    setWorkoutProgress({}); // Reset progress when starting new workout
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const endWorkout = useCallback(() => {
    setIsWorkoutActive(false);
    setActiveWorkout(null);
    setElapsedTime(0);
    setIsPaused(false);
    setWorkoutProgress({}); // Clear progress when ending workout
  }, []);

  const updateWorkoutProgress = useCallback((exerciseId, setId, field, value) => {
    setWorkoutProgress(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.id === setId);
      let newSets;
      if (setIdx === -1) {
        newSets = [...prevSets, { id: setId, [field]: value }];
      } else {
        newSets = prevSets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        );
      }
      return { ...prev, [exerciseId]: newSets };
    });
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
        endWorkout,
        workoutProgress,
        updateWorkoutProgress
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