import { SetCard } from "./ui/SetCard";
import { ActiveFocusedNavBar } from "./ui/ActiveFocusedNavBar";

export const ActiveWorkout = ({
  selectedProgram,
  exercisesLoading,
  exercises,
  handleSetComplete,
  timer,
  timerActive,
  setTimerActive,
  handleEnd,
  isSaving,
}) => (
  <div className="min-h-screen flex flex-col bg-[#353942] pb-32">
    <div className="p-6 text-2xl font-bold text-white">
      {selectedProgram?.name}
    </div>
    <div className="flex-1 flex flex-col gap-4 p-4">
      {exercisesLoading ? (
        <div className="text-white p-6">Loading exercises...</div>
      ) : (
        exercises.map((ex) => (
          <SetCard
            key={ex.id}
            exerciseId={ex.exercise_id}
            exerciseName={ex.name}
            default_view={true}
            defaultSets={ex.default_sets}
            defaultReps={ex.default_reps}
            defaultWeight={ex.default_weight}
            onSetComplete={(setData) =>
              handleSetComplete(ex.exercise_id, setData)
            }
          />
        ))
      )}
    </div>
    <ActiveFocusedNavBar
      timer={`${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(
        timer % 60
      ).padStart(2, "0")}`}
      isPaused={!timerActive}
      onPauseToggle={() => setTimerActive((a) => !a)}
      onEnd={handleEnd}
      disabled={isSaving}
    />
  </div>
);
