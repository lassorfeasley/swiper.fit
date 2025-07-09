// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=48-601

import { supabase } from "@/supabaseClient";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import { useCurrentUser } from "@/contexts/AccountContext";
import { FormHeader, SheetTitle, SheetFooter } from "@/components/atoms/sheet";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import AppLayout from "@/components/layout/AppLayout";
import RoutineCard from "@/components/common/Cards/RoutineCard";
import SwiperForm from "@/components/molecules/swiper-form";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import MainContentSection from "@/components/layout/MainContentSection";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import { toast } from "sonner";

const RoutinesIndex = () => {
  const { setPageName } = useContext(PageNameContext);
  const user = useCurrentUser();
  const { isWorkoutActive, startWorkout } = useActiveWorkout();
  const [routines, setRoutines] = useState([]);
  const [pendingProgramToStart, setPendingProgramToStart] = useState(null);
  const [confirmStartDialogOpen, setConfirmStartDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [programName, setProgramName] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [search, setSearch] = useState("");
  const inputRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPageName("Routines");
    async function fetchRoutines() {
      setLoading(true);
      if (!user) {
        setRoutines([]);
        setLoading(false);
        return;
      }
      // Fetch routines and their exercises for this user
      const { data, error } = await supabase
        .from("routines")
        .select(
          `id, routine_name, routine_exercises!fk_routine_exercises__routines(
            id,
            exercise_id,
            exercises!fk_routine_exercises__exercises(name),
            routine_sets!fk_routine_sets__routine_exercises(id)
          )`
        )
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) {
        setRoutines([]);
        setLoading(false);
        return;
      }
      // Map exercises for each program
      const routinesWithExercises = (data || []).map((program) => {
        const setCount = (program.routine_exercises || []).reduce(
          (total, pe) => total + (pe.routine_sets ? pe.routine_sets.length : 0),
          0
        );
        return {
          ...program,
          setCount,
          exerciseNames: (program.routine_exercises || [])
            .map((pe) => pe.exercises?.name)
            .filter(Boolean),
        };
      });
      setRoutines(routinesWithExercises);
      setLoading(false);
    }
    fetchRoutines();
  }, [setPageName, user, refreshFlag]);

  const handleCreateProgram = async () => {
    try {
      if (!user) throw new Error("User not authenticated");
      // 1. Insert program
      const { data: program, error: programError } = await supabase
        .from("routines")
        .insert({ routine_name: programName, user_id: user.id })
        .select()
        .single();
      if (programError || !program) throw new Error("Failed to create program");
      const program_id = program.id;
      // Success: close sheet, refresh list, and redirect
      setShowSheet(false);
      setProgramName("");
      setRefreshFlag((f) => f + 1);
      navigate(`/routines/${program_id}/configure`);
    } catch (err) {
      alert(err.message || "Failed to create program");
    }
  };

  const isReady = programName.trim().length > 0;

  const handleStart = (program) => {
    console.log('[Routines] handleStart invoked for program:', program);
    if (isWorkoutActive) {
      setPendingProgramToStart(program);
      setConfirmStartDialogOpen(true);
    } else {
      startWorkout(program)
        .then(() => navigate("/workout/active"))
        .catch((error) => {
          console.error('[Routines] startWorkout error for program', program, error);
          toast.error('Failed to start workout: ' + error.message);
        });
    }
  };

  const handleConfirmStart = () => {
    console.log('[Routines] handleConfirmStart for pending program:', pendingProgramToStart);
    setConfirmStartDialogOpen(false);
    startWorkout(pendingProgramToStart)
      .then(() => navigate("/workout/active"))
      .catch((error) => {
        console.error('[Routines] startWorkout error on confirm for program', pendingProgramToStart, error);
        toast.error('Failed to start workout: ' + error.message);
      });
  };

  // Filter routines by search
  const filteredRoutines = routines.filter((program) => {
    const q = search.toLowerCase();
    return (
      program.routine_name?.toLowerCase().includes(q) ||
      (program.exerciseNames &&
        program.exerciseNames.some((name) => name.toLowerCase().includes(q)))
    );
  });

  return (
    <AppLayout
      reserveSpace={true}
      title="Routines"
      showAdd={true}
      showSearch={true}
      showAddButton={false}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search routines or exercises"
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="routines"
      data-component="AppHeader"
      onAdd={() => {
        setShowSheet(true);
        setProgramName("");
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }}
    >
      <div className="mt-5">
        <DeckWrapper paddingX={12} gap={20}>
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : filteredRoutines.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No routines found.</div>
          ) : (
            filteredRoutines.map((program) => (
              <CardWrapper key={program.id} gap={0} marginTop={0} marginBottom={0}>
                <RoutineCard
                  id={program.id}
                  name={program.routine_name}
                  onStart={() => handleStart(program)}
                  onSettings={() => navigate(`/routines/${program.id}/configure`)}
                />
              </CardWrapper>
            ))
          )}
        </DeckWrapper>
      </div>

      <SwiperForm
        open={showSheet}
        onOpenChange={setShowSheet}
        title=""
        leftAction={() => setShowSheet(false)}
        rightAction={handleCreateProgram}
        rightEnabled={isReady}
        rightText="Create"
        leftText="Cancel"
      >
        <SwiperForm.Section>
          <TextInput
            label="Name routine"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            ref={inputRef}
          />
        </SwiperForm.Section>
      </SwiperForm>
      <SwiperAlertDialog
        open={confirmStartDialogOpen}
        onOpenChange={setConfirmStartDialogOpen}
        onConfirm={handleConfirmStart}
        title="End current workout?"
        description="Starting this routine will end your current workout. Continue?"
        confirmText="End & Start"
      />
    </AppLayout>
  );
};

export default RoutinesIndex;
