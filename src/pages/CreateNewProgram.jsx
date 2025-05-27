import React, { useRef, useEffect, useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import FocusForm from '../components/common/forms/FocusForm';
import TextField from '../components/common/forms/TextField';
import Icon from '../components/common/Icon';
import NumericInput from '../components/common/forms/NumericInput';

const CreateNewProgram = () => {
  const [programName, setProgramName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const inputRef = useRef(null);
  const exerciseNameRef = useRef(null);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  // Autofocus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // For demonstration, always show the modal overlay
  const showFocusForm = !showAddExercise;

  const isReady = programName.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col w-full relative">
      <AppHeader
        appHeaderTitle="New program"
        subheadText="example subhead text"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      {/* Main page content here */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* (Removed placeholder text) */}
      </div>
      {/* Modal overlay on top of the page */}
      {showFocusForm && (
        <FocusForm formPrompt="What should we call this program?">
          <TextField
            label="Program name"
            value={programName}
            onChange={e => setProgramName(e.target.value)}
            placeholder="Enter program name"
            inputRef={inputRef}
          />
          <div className="w-full flex justify-end mt-8">
            <button
              type="button"
              disabled={!isReady}
              className="transition-colors"
              style={{ cursor: isReady ? 'pointer' : 'not-allowed' }}
              onClick={() => isReady && setShowAddExercise(true)}
            >
              <Icon
                name="arrow_forward"
                variant="outlined"
                size={32}
                className={isReady ? 'text-black' : 'text-gray-300'}
              />
            </button>
          </div>
        </FocusForm>
      )}
      {showAddExercise && (
        <FocusForm formPrompt="Add your first exercise">
          <TextField
            label="Exercise name"
            value={exerciseName}
            onChange={e => setExerciseName(e.target.value)}
            placeholder="Enter exercise name"
            inputRef={exerciseNameRef}
          />
          <div className="flex flex-col gap-4 mt-6 w-full">
            <NumericInput
              label="Sets"
              value={sets}
              onChange={setSets}
              incrementing={true}
            />
            <NumericInput
              label="Reps"
              value={reps}
              onChange={setReps}
              incrementing={true}
            />
            <NumericInput
              label="Weight"
              value={weight}
              onChange={setWeight}
              incrementing={true}
            />
          </div>
        </FocusForm>
      )}
    </div>
  );
};

export default CreateNewProgram; 