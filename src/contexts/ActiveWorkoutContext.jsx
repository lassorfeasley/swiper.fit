import React, { createContext, useContext, useState } from 'react';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const startWorkout = (workoutData) => {
    setActiveWorkout(workoutData);
    setIsWorkoutActive(true);
  };

  const endWorkout = () => {
    setActiveWorkout(null);
    setIsWorkoutActive(false);
  };

  return (
    <ActiveWorkoutContext.Provider 
      value={{ 
        activeWorkout, 
        isWorkoutActive, 
        startWorkout, 
        endWorkout 
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