import React, { useRef } from 'react';
import ActiveExerciseCard from '@/pages/Workout/components/ActiveExerciseCard';
import { useDemoWorkout } from '@/contexts/DemoWorkoutContext';
import SetEditForm from '@/components/common/forms/SetEditForm';
import SwiperForm from '@/components/molecules/swiper-form';
import AddNewExerciseForm from '@/components/common/forms/AddNewExerciseForm';

export default function DemoWorkoutSection() {
  const {
    demoExercises,
    focusedExerciseId,
    completedExercises,
    showAddExercise,
    setShowAddExercise,
    editingSet,
    setEditingSet,
    isEditSheetOpen,
    setEditSheetOpen,
    editingExercise,
    setEditingExercise,
    editingExerciseDirty,
    setEditingExerciseDirty,
    handleSetComplete,
    handleSetEdit,
    handleSetUpdate,
    handleExerciseFocus,
    handleEditExercise,
    handleSaveExerciseEdit,
    handleAddExercise,
    setFocusedExerciseId
  } = useDemoWorkout();

  // Form refs
  const addExerciseFormRef = useRef(null);
  const editExerciseFormRef = useRef(null);

  // Filter exercises for training section (demo only shows training)
  const trainingExercises = demoExercises.filter(ex => ex.section === 'training');

  return (
    <div className="w-full max-w-[500px] bg-white flex flex-col justify-center items-center">
      {/* Exercise Cards */}
      <div className="w-full">
        {trainingExercises.map((exercise, index) => {
          const isFocused = focusedExerciseId === exercise.exercise_id;
          const isCompleted = completedExercises.has(exercise.exercise_id);
          const isLastExercise = index === trainingExercises.length - 1;
          
          return (
            <div key={exercise.id}>
              <div 
                className="cursor-pointer"
                onClick={() => handleExerciseFocus(exercise.exercise_id)}
              >
                <ActiveExerciseCard
                  exerciseId={exercise.exercise_id}
                  exerciseName={exercise.name}
                  initialSetConfigs={exercise.setConfigs}
                  onSetComplete={handleSetComplete}
                  onSetDataChange={handleSetUpdate}
                  onExerciseComplete={() => {
                    // Mark exercise as completed
                    setCompletedExercises(prev => new Set([...prev, exercise.exercise_id]));
                  }}
                  onSetPress={(setConfig, index) => handleSetEdit(exercise.exercise_id, setConfig, index)}
                  isFocused={isFocused}
                  isExpanded={isFocused}
                  onFocus={() => handleExerciseFocus(exercise.exercise_id)}
                  onEditExercise={() => handleEditExercise(exercise)}
                  index={index}
                  focusedIndex={trainingExercises.findIndex(e => e.exercise_id === focusedExerciseId)}
                  totalCards={trainingExercises.length}
                  topOffset={80 + index * 64}
                />
              </div>
              
              {/* Add Exercise Button - only show under the last exercise when it's focused */}
              {isFocused && isLastExercise && (
                <div className="px-3 pb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddExercise(true);
                    }}
                    className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    + Add Exercise
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Set Edit Form */}
      {editingSet && (
        <SwiperForm
          open={isEditSheetOpen}
          onOpenChange={setEditSheetOpen}
          title="Edit Set"
          leftAction={() => setEditSheetOpen(false)}
          rightAction={() => {
            // Handle form submission
            setEditSheetOpen(false);
            setEditingSet(null);
          }}
          rightText="Save"
          leftText="Cancel"
          padding={0}
        >
          <SetEditForm
            initialValues={editingSet.setConfig}
            onSubmit={(values) => {
              handleSetUpdate(editingSet.exerciseId, editingSet.setConfig, values);
              setEditSheetOpen(false);
              setEditingSet(null);
            }}
            onCancel={() => {
              setEditSheetOpen(false);
              setEditingSet(null);
            }}
          />
        </SwiperForm>
      )}

      {/* Add Exercise Form */}
      <SwiperForm
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        title="Create"
        leftAction={() => setShowAddExercise(false)}
        rightAction={() => addExerciseFormRef.current?.requestSubmit?.()}
        rightText="Add"
        leftText="Cancel"
        padding={0}
        className="add-exercise-drawer"
      >
        <div className="flex-1 overflow-y-auto">
          <AddNewExerciseForm
            ref={addExerciseFormRef}
            formPrompt="Add a new training exercise"
            disabled={false}
            onActionIconClick={(data) => handleAddExercise(data)}
            initialSets={3}
            initialSection="training"
            initialSetConfigs={Array.from({ length: 3 }, () => ({
              reps: 10,
              weight: 25,
              unit: "lbs",
            }))}
            hideActionButtons={true}
          />
        </div>
      </SwiperForm>

      {/* Exercise Edit Form */}
      {editingExercise && (
        <SwiperForm
          open={!!editingExercise}
          onOpenChange={() => setEditingExercise(null)}
          title="Edit exercise"
          description="Edit exercise details including name, section, and sets"
          leftAction={() => setEditingExercise(null)}
          leftText="Close"
          rightAction={() => {
            if (editExerciseFormRef.current) {
              editExerciseFormRef.current.requestSubmit();
            }
          }}
          rightText="Save"
          rightEnabled={editingExerciseDirty}
          padding={0}
          className="edit-exercise-drawer"
        >
          <div className="flex-1 overflow-y-auto">
            <AddNewExerciseForm
              ref={editExerciseFormRef}
              key={`edit-${editingExercise.id}`}
              formPrompt="Edit training exercise"
              initialName={editingExercise.name}
              initialSection={
                editingExercise.section === "workout"
                  ? "training"
                  : editingExercise.section
              }
              initialSets={editingExercise.setConfigs?.length || 0}
              initialSetConfigs={editingExercise.setConfigs}
              hideActionButtons={true}
              showAddToProgramToggle={false}
              hideSetDefaults={true}
              onActionIconClick={(data) => handleSaveExerciseEdit(data)}
              onDirtyChange={setEditingExerciseDirty}
              showUpdateTypeToggle={false}
            />
          </div>
        </SwiperForm>
      )}
    </div>
  );
}
