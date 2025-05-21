import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProgramSelection, ActiveWorkout } from "../components";
import { useNavBarVisibility } from "../NavBarVisibilityContext";
import { workoutApi } from "../api/workoutApi";

const Workout = () => {
  const [step, setStep] = useState("select"); // 'select' or 'active'
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const timerRef = useRef();
  const [completedSets, setCompletedSets] = useState({});
  const { setNavBarVisible } = useNavBarVisibility();
  const queryClient = useQueryClient();

  // Query for programs
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: workoutApi.getPrograms,
    enabled: step === "select",
  });

  // Query for exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["programExercises", selectedProgram?.id],
    queryFn: () => workoutApi.getProgramExercises(selectedProgram.id),
    enabled: !!selectedProgram,
  });

  // Mutation for saving workout
  const { mutate: saveWorkout, isLoading: isSaving } = useMutation({
    mutationFn: workoutApi.saveWorkout,
    onSuccess: () => {
      // Reset state after successful save
      setStep("select");
      setSelectedProgram(null);
      setTimer(0);
      setCompletedSets({});
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (error) => {
      console.error("Failed to save workout:", error);
      alert("Failed to save workout! " + error.message);
    },
  });

  // Hide/show nav bar based on step
  useEffect(() => {
    setNavBarVisible(step !== "active");
    return () => setNavBarVisible(true);
  }, [step, setNavBarVisible]);

  // Timer logic
  useEffect(() => {
    if (step !== "active") return;
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, step]);

  // Handle set completion
  const handleSetComplete = (exerciseId, setData) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), setData],
    }));
  };

  // Handle workout end
  const handleEnd = async () => {
    setTimerActive(false);
    saveWorkout({
      programId: selectedProgram.id,
      durationSeconds: timer,
      userId: "bed5cb48-0242-4894-b58d-94ac01de22ff", // real user id
      sets: completedSets,
    });
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setStep("active");
  };

  return step === "select" ? (
    <ProgramSelection
      programs={programs}
      programsLoading={programsLoading}
      onProgramSelect={handleProgramSelect}
    />
  ) : (
    <ActiveWorkout
      selectedProgram={selectedProgram}
      exercisesLoading={exercisesLoading}
      exercises={exercises}
      handleSetComplete={handleSetComplete}
      timer={timer}
      timerActive={timerActive}
      setTimerActive={setTimerActive}
      handleEnd={handleEnd}
      isSaving={isSaving}
    />
  );
};

export default Workout;
