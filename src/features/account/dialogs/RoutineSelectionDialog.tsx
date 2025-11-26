import React, { useState, useRef } from "react";
import SwiperDialog from "@/components/shared/SwiperDialog";
import SwiperForm from "@/components/shared/SwiperForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { ActionCard } from "@/components/shared/ActionCard";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import StartWorkoutCard from "@/components/shared/cards/StartWorkoutCard";
import RoutineCard from "@/features/routines/components/RoutineCard";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";

interface RoutineSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any; // Profile
  routines: any[];
  mode: 'workout' | 'manage';
  onSelectRoutine: (routine: any) => void;
  onCreateRoutine: (name: string) => void;
  onCancel: () => void;
}

const RoutineSelectionDialog: React.FC<RoutineSelectionDialogProps> = ({
  open,
  onOpenChange,
  client,
  routines,
  mode,
  onSelectRoutine,
  onCreateRoutine,
  onCancel,
}) => {
  const [showCreateRoutineSheet, setShowCreateRoutineSheet] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const createNameInputRef = useRef<HTMLInputElement>(null);

  const formatUserDisplay = (profile: any) => {
    if (!profile) return "Unknown User";
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email;
  };

  const handleCreateClick = () => {
    onOpenChange(false); // Hide parent dialog temporarily? Or keep it open?
    // The original logic hid the routine selection dialog and showed the sheet.
    // But here we might want to handle it differently or replicate that behavior.
    // For now, let's manage the sheet visibility inside this component.
    setNewRoutineName("");
    setShowCreateRoutineSheet(true);
    setTimeout(() => {
      if (createNameInputRef.current) createNameInputRef.current.focus();
    }, 100);
  };

  const handleConfirmCreate = () => {
    onCreateRoutine(newRoutineName);
    setShowCreateRoutineSheet(false);
  };

  return (
    <>
      <SwiperDialog
        open={open && !showCreateRoutineSheet}
        onOpenChange={onOpenChange}
        title={mode === 'workout' ? `Start a workout for ${formatUserDisplay(client)}` : `${formatUserDisplay(client)}'s routines`}
        hideFooter
        containerClassName="bg-stone-100"
        headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center"
        bodyClassName="min-h-0 overflow-y-auto pt-3"
        maxBodyHeight="60vh"
        headerRight={
          <button
            onClick={onCancel}
            className="w-4 h-4 bg-red-300 rounded-full border border-neutral-neutral-300 hover:bg-red-400 transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-neutral-neutral-300"
            aria-label="Close dialog"
          />
        }
        onCancel={onCancel}
      >
        <div className="w-full flex flex-col items-center gap-3 pb-4">
          {mode !== 'workout' && (
            <CardWrapper gap={0} marginTop={0} marginBottom={0}>
              <ActionCard
                text="Create new routine"
                className="self-stretch w-full"
                onClick={handleCreateClick}
              />
            </CardWrapper>
          )}

          {routines.map((routine) => (
            mode === 'workout' ? (
              <div key={routine.id} className="w-full flex justify-center">
                <StartWorkoutCard
                  id={routine.id}
                  name={routine.routine_name || `Routine ${routine.id}`}
                  lastCompleted={routine.lastCompletedText}
                  routineData={routine}
                  onCardClick={() => onSelectRoutine(routine)}
                />
              </div>
            ) : (
              <CardWrapper key={routine.id} gap={0} marginTop={0} marginBottom={0}>
                <RoutineCard
                  id={routine.id}
                  name={routine.routine_name || `Routine ${routine.id}`}
                  lastCompleted={routine.lastCompletedText}
                  routineData={routine}
                  onCardClick={() => onSelectRoutine(routine)}
                />
              </CardWrapper>
            )
          ))}
          {routines.length === 0 && (
            <div className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden">
              <div className="self-stretch flex flex-col justify-start items-start gap-5">
                <div className="self-stretch flex flex-col justify-start items-start">
                  <div className="w-[452px] justify-start text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight text-neutral-neutral-600">
                    {mode === 'workout' ? 'No routines found for this client.' : 'No routines found for this account.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SwiperDialog>

      {/* Create routine name sheet */}
      <SwiperForm
        open={showCreateRoutineSheet}
        onOpenChange={(open) => {
            setShowCreateRoutineSheet(open);
            if (!open) onOpenChange(true); // Re-open parent when sheet closes? Or just close sheet?
            // Original behavior: leftAction closed sheet and opened selection dialog.
        }}
        title=""
        description={`Create a new workout routine for ${formatUserDisplay(client)}`}
        leftAction={() => {
          setShowCreateRoutineSheet(false);
          // Re-open the selection dialog if it was "closed" or just ensure it's visible
          // In this implementation, selection dialog is hidden when sheet is open via conditional rendering
        }}
        rightAction={handleConfirmCreate}
        rightEnabled={(newRoutineName || "").trim().length > 0}
        rightText="Create"
        leftText="Cancel"
      >
        <FormSectionWrapper bordered={false}>
          <div className="w-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-2">
              <div className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Name routine</div>
              <div
                className={`${(newRoutineName || '').length >= MAX_ROUTINE_NAME_LEN ? 'text-red-400' : 'text-neutral-400'} text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight`}
                aria-live="polite"
              >
                {(newRoutineName || '').length} of {MAX_ROUTINE_NAME_LEN} characters
              </div>
            </div>
            <TextInput
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              ref={createNameInputRef}
              maxLength={MAX_ROUTINE_NAME_LEN}
              error={(newRoutineName || '').length >= MAX_ROUTINE_NAME_LEN}
            />
          </div>
        </FormSectionWrapper>
      </SwiperForm>
    </>
  );
};

export default RoutineSelectionDialog;

