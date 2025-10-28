import React, { useRef, useState, useCallback } from 'react';
import DemoActiveExerciseCard from '@/pages/Landing/demo/DemoActiveExerciseCard';
import { useDemoWorkout } from '@/contexts/DemoWorkoutContext';
import { SetEditForm } from '@/features/routines';
import SwiperForm from '@/components/shared/SwiperForm';
import SwiperDialog from '@/components/shared/SwiperDialog';
import { AddNewExerciseForm } from '@/features/routines';
import DeckWrapper from '@/components/shared/cards/wrappers/DeckWrapper';
import CardWrapper from '@/components/shared/cards/wrappers/CardWrapper';
import { ActionCard } from '@/components/shared/ActionCard';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DemoWorkoutSection() {
  const isMobile = useIsMobile();
  const {
    demoExercises,
    focusedExerciseId,
    completedExercises,
    setCompletedExercises,
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
    autoCompleteEnabled,
    setAutoCompleteEnabled,
    userHasInteracted,
    handleSetComplete,
    handleSetMarkIncomplete,
    handleSetEdit,
    handleSetUpdate,
    handleSetDelete,
    handleExerciseFocus,
    handleEditExercise,
    handleSaveExerciseEdit,
    handleOpenAddExercise,
    handleAddExercise,
    startAutoComplete,
    stopAutoComplete,
    resetDemo
  } = useDemoWorkout();

  // Undo confirmation dialog state
  const [confirmUndoSetOpen, setConfirmUndoSetOpen] = useState(false);
  const undoTargetRef = useRef(null);

  // Handle marking a set incomplete
  const handleSetMarkIncompleteConfirm = useCallback(() => {
    const target = undoTargetRef.current;
    if (!target?.exerciseId || !target?.setConfig) {
      setConfirmUndoSetOpen(false);
      return;
    }
    
    handleSetMarkIncomplete(target.exerciseId, target.setConfig);
    setConfirmUndoSetOpen(false);
    undoTargetRef.current = null;
  }, [handleSetMarkIncomplete]);

  // Handle set press - check if complete and show confirmation
  const handleSetPressWithCheck = useCallback((exerciseId, setConfig, index) => {
    // If completed set is tapped, open undo dialog instead of editor
    if (setConfig?.status === 'complete') {
      undoTargetRef.current = { exerciseId, setConfig, index };
      setConfirmUndoSetOpen(true);
      return;
    }
    
    // Otherwise, open the edit dialog
    handleSetEdit(exerciseId, setConfig, index);
  }, [handleSetEdit]);

  // Filter exercises for training section (demo only shows training)
  const trainingExercises = demoExercises.filter(ex => ex.section === 'training');

  // Focus first exercise on component mount only if no exercise is focused
  React.useEffect(() => {
    if (trainingExercises.length > 0 && !focusedExerciseId) {
      console.log('Auto-focusing first exercise:', trainingExercises[0].exercise_id);
      handleExerciseFocus(trainingExercises[0].exercise_id, false); // Not a manual click
    }
  }, [trainingExercises, focusedExerciseId, handleExerciseFocus]);

  // Auto-start the demo on component mount
  React.useEffect(() => {
    console.log('Setting up auto-complete timer');
    const timer = setTimeout(() => {
      console.log('Starting auto-complete from DemoWorkoutSection');
      startAutoComplete();
    }, 3000); // Start after 3 seconds to let first exercise stay focused

    return () => clearTimeout(timer);
  }, [startAutoComplete]);

  // No hover handling - only disable auto-complete on actual clicks

  // Form refs
  const addExerciseFormRef = useRef(null);
  const editExerciseFormRef = useRef(null);
  const setEditFormRef = useRef(null);

  return (
    <div className="w-full bg-transparent h-full">
      {/* Exercise Cards Container - flexible height, scroll within on mobile */}
      <div 
        className="w-full demo-workout-container flex-1 h-full min-h-0 flex flex-col items-center justify-start overflow-y-visible px-0"
      >
        <DeckWrapper
          gap={12}
          className="flex flex-1 justify-center items-start h-full"
          paddingTop={40}
          paddingBottom={0}
          maxWidth={500}
          minWidth={0}
          useChildMargin={true}
          style={{ 
            minHeight: '100vh'
          }}

        >
          {trainingExercises.map((exercise, index) => {
            const isFocused = focusedExerciseId === exercise.exercise_id;
            const isCompleted = completedExercises.has(exercise.exercise_id);
            const isLastExercise = index === trainingExercises.length - 1;
            console.log('Rendering exercise:', exercise.exercise_id, 'isCompleted:', isCompleted, 'completedExercises:', Array.from(completedExercises));
            
            return (
              <CardWrapper
                key={exercise.id}
                reorderable={false}
                className="cursor-pointer"
              >
                <DemoActiveExerciseCard
                  exerciseId={exercise.exercise_id}
                  exerciseName={exercise.name}
                  initialSetConfigs={exercise.setConfigs}
                  onSetComplete={(exerciseId, setConfig) => handleSetComplete(exerciseId, setConfig, true)}
                  onSetPress={(setConfig, index) => handleSetPressWithCheck(exercise.exercise_id, setConfig, index)}
                  isFocused={isFocused}
                  isExpanded={isFocused}
                  onFocus={() => handleExerciseFocus(exercise.exercise_id, true)}
                  onEditExercise={() => handleEditExercise(exercise)}
                  index={index}
                  focusedIndex={trainingExercises.findIndex(e => e.exercise_id === focusedExerciseId)}
                  totalCards={trainingExercises.length}
                  isCompleted={isCompleted}
                />
              </CardWrapper>
            );
          })}
          <div className="w-full">
            <ActionCard 
              text="Add exercise"
              className="self-stretch w-full"
              onClick={handleOpenAddExercise}
            />
          </div>
        </DeckWrapper>
      </div>

      {/* Set Edit Form */}
      {editingSet && (
        <SwiperForm
          open={isEditSheetOpen}
          onOpenChange={() => setEditSheetOpen(false)}
          title="Edit Set"
          leftAction={() => setEditSheetOpen(false)}
          rightAction={() => {
            // Trigger form submission
            if (setEditFormRef.current) {
              setEditFormRef.current.handleSaveSet();
            }
          }}
          rightText="Save"
          leftText="Cancel"
          padding={0}
          className="edit-set-drawer"
        >
          <SetEditForm
            ref={setEditFormRef}
            hideToggle={true}
            initialValues={{
              ...editingSet.setConfig,
              // Map weight_unit to unit for the form
              unit: editingSet.setConfig.weight_unit || editingSet.setConfig.unit || 'lbs'
            }}
            onSave={(values) => {
              // Map unit back to weight_unit when saving
              const updatedValues = {
                ...values,
                weight_unit: values.unit
              };
              handleSetUpdate(editingSet.exerciseId, editingSet.setConfig, updatedValues);
              setEditSheetOpen(false);
              setEditingSet(null);
            }}
            onDelete={() => {
              handleSetDelete(editingSet.exerciseId, editingSet.setConfig);
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
        onOpenChange={() => setShowAddExercise(false)}
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
            initialName="New exercise"
            initialSets={3}
            initialSection="training"
            initialSetConfigs={Array.from({ length: 3 }, () => ({
              reps: 10,
              weight: 25,
              unit: "lbs",
            }))}
            hideActionButtons={true}
            showAddToProgramToggle={false}
            showSectionToggle={false}
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
              showSectionToggle={false} // Hide section toggle on landing page
              hideSetDefaults={true}
              onActionIconClick={(data) => handleSaveExerciseEdit(data)}
              onDirtyChange={setEditingExerciseDirty}
              showUpdateTypeToggle={false}
            />
          </div>
        </SwiperForm>
      )}

      {/* Confirm undo completed set */}
      <SwiperDialog
        open={confirmUndoSetOpen}
        onOpenChange={setConfirmUndoSetOpen}
        onConfirm={handleSetMarkIncompleteConfirm}
        onCancel={() => setConfirmUndoSetOpen(false)}
        title="Mark set incomplete?"
        description="This will undo the completion of the set"
        confirmText="Mark incomplete"
        cancelText="Cancel"
      />
    </div>
  );
}
