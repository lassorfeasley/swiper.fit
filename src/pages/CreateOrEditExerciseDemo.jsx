import React, { useRef, useEffect, useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import FocusForm from '../components/common/forms/FocusForm';
import TextField from '../components/common/forms/TextField';
import NumericInput from '../components/common/forms/NumericInput';
import { useNavBarVisibility } from '../NavBarVisibilityContext';

const CreateOrEditExerciseDemo = () => {
  const inputRef = useRef(null);
  const { setNavBarVisible } = useNavBarVisibility();
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3); // Default value of 3
  const [reps, setReps] = useState(0); // Default value of 0

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  // Autofocus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col w-full relative">
      <AppHeader
        appHeaderTitle="Create or Edit Exercise Demo"
        subheadText="Demo for exercise creation form development"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Placeholder for main content */}
      </div>
      <FocusForm formPrompt="Create a new exercise">
        <TextField
          label="Exercise name"
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
          placeholder="Enter exercise name"
          inputRef={inputRef}
          className="w-full"
        />
        <NumericInput
          label="Sets"
          value={sets}
          onChange={setSets}
          incrementing={true}
          className="w-full"
        />
        <NumericInput
          label="Reps"
          value={reps}
          onChange={setReps}
          incrementing={true}
          className="w-full"
        />
      </FocusForm>
    </div>
  );
};

export default CreateOrEditExerciseDemo; 