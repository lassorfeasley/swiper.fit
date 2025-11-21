// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=48-601

import { supabase } from "@/supabaseClient";
import { postSlackEvent } from "@/lib/slackEvents";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import { useCurrentUser, useAccount } from "@/contexts/AccountContext";
import { FormHeader, SheetTitle, SheetFooter } from "@/components/shadcn/sheet";
// import { Input } from "@/components/ui/input";
import { Button } from "@/components/shadcn/button";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import AppLayout from "@/components/layout/AppLayout";
import RoutineCard from "../components/RoutineCard";
import SwiperForm from "@/components/shared/SwiperForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/shared/inputs/TextInput";
import MainContentSection from "@/components/layout/MainContentSection";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { ActionCard } from "@/components/shared/ActionCard";
import { toast } from "@/lib/toastReplacement";
import { Plus, ListChecks } from "lucide-react";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";
import { useSpacing } from "@/hooks/useSpacing";
import { EmptyState } from "@/components/shared/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserRoutines, routineKeys } from "@/lib/queries/routines";

const RoutinesIndex = () => {
  const { setPageName } = useContext(PageNameContext);
  const user = useCurrentUser();
  const { isDelegated } = useAccount();
  const { isWorkoutActive, startWorkout } = useActiveWorkout();
  const queryClient = useQueryClient();

  const [showSheet, setShowSheet] = useState(false);
  const [programName, setProgramName] = useState("");
  const [search, setSearch] = useState("");
  const inputRef = React.useRef(null);
  const navigate = useNavigate();
  
  // Use spacing hook for consistent layout
  const spacing = useSpacing('SIMPLE_LIST');

  useEffect(() => {
    setPageName("Routines");
  }, [setPageName]);

  const routinesQuery = useQuery({
    queryKey: routineKeys.list(user?.id),
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return fetchUserRoutines(user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60,
  });

  const routines = routinesQuery.data || [];
  const isRoutinesLoading = routinesQuery.isLoading || routinesQuery.isFetching;

  const handleCreateProgram = async () => {
    try {
      if (!user) throw new Error("User not authenticated");
      // 1. Insert program
      const { data: program, error: programError } = await supabase
        .from("routines")
        .insert({ 
          routine_name: programName.slice(0, MAX_ROUTINE_NAME_LEN), 
          user_id: user.id, 
          created_by: user.id,
          shared_by: user.id
        })
        .select()
        .single();
      if (programError || !program) throw new Error("Failed to create program");
      const program_id = program.id;
      // Success: close sheet, refresh list, and redirect
      setShowSheet(false);
      setProgramName("");
      await queryClient.invalidateQueries({ queryKey: routineKeys.list(user.id) });
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
      reserveSpace={false}
      title="Routines"
      showPlusButton={false}
      showShare={false}
      showSettings={false}
      showDelete={false}
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
            gap={spacing.gap} 
            paddingTop={spacing.paddingTop}
            paddingBottom={spacing.paddingBottom}
            maxWidth={spacing.maxWidth}
            className="flex-1 mt-0 min-h-screen"
          >
          {routinesQuery.error ? (
            <div className="text-red-500 text-center py-8">
              {(routinesQuery.error as Error).message || "Failed to load routines."}
            </div>
          ) : isRoutinesLoading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : filteredRoutines.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Create your first routine."
              description="Create a routine by adding exercises and sets. It only takes a minute!"
            />
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
            <CardWrapper gap={0} marginTop={0} marginBottom={0}>
              <ActionCard
                text="Create new routine"
                onClick={() => {
                  setShowSheet(true);
                  setProgramName("");
                  setTimeout(() => {
                    if (inputRef.current) inputRef.current.focus();
                  }, 0);
                }}
                className="self-stretch w-full"
              />
            </CardWrapper>
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
        <FormSectionWrapper bordered={false}>
          <div className="w-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-2">
              <div className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Name routine</div>
              <div
                className={`${(programName || '').length >= MAX_ROUTINE_NAME_LEN ? 'text-red-400' : 'text-neutral-400'} text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight`}
                aria-live="polite"
              >
                {(programName || '').length} of {MAX_ROUTINE_NAME_LEN} characters
              </div>
            </div>
            <TextInput
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              ref={inputRef}
              maxLength={MAX_ROUTINE_NAME_LEN}
              error={(programName || '').length >= MAX_ROUTINE_NAME_LEN}
            />
          </div>
        </FormSectionWrapper>
      </SwiperForm>

    </AppLayout>
  );
};

export default RoutinesIndex;
