// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=48-601

import { supabase } from "@/supabaseClient";
import { postSlackEvent } from "@/lib/slackEvents";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import { useCurrentUser, useAccount } from "@/contexts/AccountContext";
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
import { ActionCard } from "@/components/molecules/action-card";
import { toast } from "sonner";

const RoutinesIndex = () => {
  const { setPageName } = useContext(PageNameContext);
  const user = useCurrentUser();
  const { isDelegated } = useAccount();
  const { isWorkoutActive, startWorkout } = useActiveWorkout();
  const [routines, setRoutines] = useState([]);

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
          ),
          workouts!fk_workouts__routines(
            id,
            completed_at
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
        
        // Get the most recent completed workout
        const completedWorkouts = (program.workouts || []).filter(w => w.completed_at);
        const lastCompletedWorkout = completedWorkouts.length > 0 
          ? completedWorkouts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
          : null;
        
        // Format the completion date
        let lastCompletedText = null;
        if (lastCompletedWorkout) {
          const completedDate = new Date(lastCompletedWorkout.completed_at);
          const now = new Date();
          const diffTime = Math.abs(now - completedDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            lastCompletedText = "Completed yesterday";
          } else if (diffDays < 7) {
            lastCompletedText = `Completed ${diffDays} days ago`;
          } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            lastCompletedText = `Completed ${weeks} week${weeks > 1 ? 's' : ''} ago`;
          } else {
            const months = Math.floor(diffDays / 30);
            lastCompletedText = `Completed ${months} month${months > 1 ? 's' : ''} ago`;
          }
        }
        
        return {
          ...program,
          setCount,
          exerciseNames: (program.routine_exercises || [])
            .map((pe) => pe.exercises?.name)
            .filter(Boolean),
          lastCompleted: lastCompletedText,
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
        .insert({ routine_name: programName, user_id: user.id, is_public: true })
        .select()
        .single();
      if (programError || !program) throw new Error("Failed to create program");
      const program_id = program.id;
      // Success: close sheet, refresh list, and redirect
      setShowSheet(false);
      setProgramName("");
      setRefreshFlag((f) => f + 1);
      // Slack notify (fire-and-forget)
      postSlackEvent('routine.created', {
        routine_id: program_id,
        user_id: user.id,
        routine_name: program.routine_name || programName,
      });
      navigate(`/routines/${program_id}/configure`);
    } catch (err) {
      alert(err.message || "Failed to create program");
    }
  };

  const isReady = programName.trim().length > 0;



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
      variant="glass"
      title="Routines"
      showPlusButton={true}
      onAdd={() => {
        setShowSheet(true);
        setProgramName("");
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }}
      showSearch={false}
      showBackButton={false}
      search={false}
      pageContext="routines"
      className="bg-gradient-to-l from-white/0 to-white backdrop-blur-[2px] px-3 pt-4 pb-3"
      data-component="AppHeader"
      showSidebar={!isDelegated}
    >
      <MainContentSection className="!p-0 flex-1 min-h-0 flex flex-col">
        <div className="flex justify-center flex-1">
          <DeckWrapper 
            gap={12} 
            paddingTop={82}
            paddingBottom={0}
            maxWidth={null}
            className="flex-1 mt-0 min-h-screen"
          >
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
                  lastCompleted={program.lastCompleted}
                  routineData={program}
                />
              </CardWrapper>
            ))
          )}
        </DeckWrapper>
        </div>
      </MainContentSection>

      <SwiperForm
        open={showSheet}
        onOpenChange={setShowSheet}
        title=""
        description="Create a new workout routine"
        leftAction={() => setShowSheet(false)}
        rightAction={handleCreateProgram}
        rightEnabled={isReady}
        rightText="Create"
        leftText="Cancel"
      >
        <SwiperForm.Section bordered={false}>
          <TextInput
            label="Name routine"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            ref={inputRef}
          />
        </SwiperForm.Section>
      </SwiperForm>

    </AppLayout>
  );
};

export default RoutinesIndex;
