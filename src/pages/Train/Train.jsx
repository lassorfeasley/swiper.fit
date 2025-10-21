import React, { useEffect, useState, useContext } from "react";
import { supabase } from "@/supabaseClient";
import { PageNameContext } from "@/App";
import { useCurrentUser, useAccount } from "@/contexts/AccountContext";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import AppLayout from "@/components/layout/AppLayout";
import StartWorkoutCard from "@/components/common/Cards/StartWorkoutCard";
import MainContentSection from "@/components/layout/MainContentSection";
import { toast } from "sonner";

const Train = () => {
  const { setPageName } = useContext(PageNameContext);
  const user = useCurrentUser();
  const { isDelegated } = useAccount();
  const { isWorkoutActive } = useActiveWorkout();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageName("Train");
    async function fetchRoutinesSortedByFrequency() {
      setLoading(true);
      if (!user) {
        setRoutines([]);
        setLoading(false);
        return;
      }

      try {
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Fetch routines with their workout completion data
        const { data, error } = await supabase
          .from("routines")
          .select(
            `id, 
             routine_name, 
             created_at,
             routine_exercises!fk_routine_exercises__routines(
               id,
               exercise_id,
               exercises!fk_routine_exercises__exercises(name, section),
               routine_sets!fk_routine_sets__routine_exercises(
                 id,
                 reps,
                 weight,
                 weight_unit,
                 set_order,
                 set_variant,
                 set_type,
                 timed_set_duration
               )
             ),
             workouts!fk_workouts__routines(
               id,
               completed_at
             )`
          )
          .eq("user_id", user.id)
          .eq("is_archived", false);

        if (error) {
          console.error("Error fetching routines:", error);
          setRoutines([]);
          setLoading(false);
          return;
        }

        // Process and sort routines by completion frequency
        const routinesWithFrequency = (data || []).map((routine) => {
          // Count completions in the past 30 days
          const recentCompletions = (routine.workouts || []).filter(
            (workout) => workout.completed_at && workout.completed_at >= thirtyDaysAgoISO
          ).length;

          // Get the most recent completed workout for display
          const completedWorkouts = (routine.workouts || []).filter((w) => w.completed_at);
          const lastCompletedWorkout = completedWorkouts.length > 0
            ? completedWorkouts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
            : null;

          // Format the completion date
          let lastCompletedText = null;
          if (lastCompletedWorkout) {
            const completedDate = new Date(lastCompletedWorkout.completed_at);
            const now = new Date();

            const completedDateOnly = new Date(
              completedDate.getFullYear(),
              completedDate.getMonth(),
              completedDate.getDate()
            );
            const nowDateOnly = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );

            const diffTime = Math.abs(nowDateOnly - completedDateOnly);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
              lastCompletedText = "Last completed today";
            } else if (diffDays === 1) {
              lastCompletedText = "Last completed yesterday";
            } else if (diffDays < 7) {
              lastCompletedText = `Last completed ${diffDays} days ago`;
            } else if (diffDays < 30) {
              const weeks = Math.floor(diffDays / 7);
              lastCompletedText = `Last completed ${weeks} week${weeks > 1 ? 's' : ''} ago`;
            } else {
              const months = Math.floor(diffDays / 30);
              lastCompletedText = `Last completed ${months} month${months > 1 ? 's' : ''} ago`;
            }
          }

          return {
            ...routine,
            recentCompletions,
            lastCompleted: lastCompletedText,
          };
        });

        // Sort by completion frequency (desc), then by creation date (desc)
        const sortedRoutines = routinesWithFrequency.sort((a, b) => {
          // First sort by completion frequency
          if (a.recentCompletions !== b.recentCompletions) {
            return b.recentCompletions - a.recentCompletions;
          }
          // Then by creation date (most recent first)
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setRoutines(sortedRoutines);
      } catch (error) {
        console.error("Error processing routines:", error);
        toast.error("Failed to load routines");
        setRoutines([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutinesSortedByFrequency();
  }, [setPageName, user]);

  if (loading) {
    return (
      <AppLayout
        reserveSpace={true}
        variant="glass"
        title="Train"
        showSidebar={true}
        showShare={false}
        showBackButton={false}
        search={false}
        pageContext="train"
      >
        <MainContentSection className="!p-0 flex-1 min-h-0">
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <h1 className="text-2xl font-bold text-neutral-700 mb-4">Train</h1>
            <p className="text-neutral-500">Loading your routines...</p>
          </div>
        </MainContentSection>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout
        reserveSpace={true}
        variant="glass"
        title="Train"
        showSidebar={true}
        showShare={false}
        showBackButton={false}
        search={false}
        pageContext="train"
      >
        <MainContentSection className="!p-0 flex-1 min-h-0">
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <h1 className="text-2xl font-bold text-neutral-700 mb-4">Train</h1>
            <p className="text-neutral-500">Please log in to access your routines</p>
          </div>
        </MainContentSection>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      reserveSpace={true}
      variant="glass"
      title="Train"
      showSidebar={true}
      showShare={false}
      showBackButton={false}
      search={false}
      pageContext="train"
    >
      <MainContentSection className="!p-0 flex-1 min-h-0 flex flex-col">
        <div className="flex justify-center flex-1">
          <DeckWrapper 
            gap={12} 
            paddingTop={82}
            paddingBottom={0}
            maxWidth={500}
            className="flex-1 mt-0 min-h-screen"
          >
          {routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <h1 className="text-2xl font-bold text-neutral-700 mb-4">No Routines Yet</h1>
              <p className="text-neutral-500">Create your first routine to get started</p>
            </div>
          ) : (
            routines.map((routine) => (
              <StartWorkoutCard
                key={routine.id}
                id={routine.id}
                name={routine.routine_name}
                lastCompleted={routine.lastCompleted}
                routineData={routine}
              />
            ))
          )}
          </DeckWrapper>
        </div>
      </MainContentSection>
    </AppLayout>
  );
};

export default Train;
