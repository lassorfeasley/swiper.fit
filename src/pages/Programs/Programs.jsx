// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=48-601

import { supabase } from "@/supabaseClient";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import ProgramCard from '@/components/common/Cards/ProgramCard';
import { useAuth } from "@/contexts/AuthContext";
import { SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import AppLayout from '@/components/layout/AppLayout';

const ProgramsIndex = () => {
  const { setPageName } = useContext(PageNameContext);
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [programName, setProgramName] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [search, setSearch] = useState("");
  const inputRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPageName("Programs");
    async function fetchPrograms() {
      setLoading(true);
      if (!user) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // Fetch programs and their exercises for this user
      const { data, error } = await supabase
        .from("programs")
        .select(`
          id,
          program_name,
          program_exercises (
            exercise_id,
            exercises ( name )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // Map exercises for each program
      const programsWithExercises = (data || []).map(program => ({
        ...program,
        exerciseNames: (program.program_exercises || [])
          .map(pe => pe.exercises?.name)
          .filter(Boolean)
      }));
      setPrograms(programsWithExercises);
      setLoading(false);
    }
    fetchPrograms();
  }, [setPageName, user, refreshFlag]);

  const handleCreateProgram = async () => {
    try {
      if (!user) throw new Error("User not authenticated");
      // 1. Insert program
      const { data: program, error: programError } = await supabase
        .from("programs")
        .insert({ program_name: programName, user_id: user.id })
        .select()
        .single();
      if (programError || !program) throw new Error("Failed to create program");
      const program_id = program.id;
      // Success: close sheet, refresh list, and redirect
      setShowSheet(false);
      setProgramName("");
      setRefreshFlag(f => f + 1);
      navigate(`/programs/${program_id}/configure`);
    } catch (err) {
      alert(err.message || "Failed to create program");
    }
  };

  const isReady = programName.trim().length > 0;

  // Filter programs by search
  const filteredPrograms = programs.filter(program => {
    const q = search.toLowerCase();
    return (
      program.program_name?.toLowerCase().includes(q) ||
      (program.exerciseNames && program.exerciseNames.some(name => name.toLowerCase().includes(q)))
    );
  });

  return (
    <AppLayout
      appHeaderTitle="Programs"
      actionBarText="Create new program"
      showActionBar={true}
      showActionIcon={false}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search programs or exercises"
      searchValue={search}
      onSearchChange={setSearch}
      onAction={() => {
        setShowSheet(true);
        setProgramName("");
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }}
      data-component="AppHeader"
    >
      <CardWrapper className="px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No programs found.
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              programName={program.program_name}
              exerciseNames={program.exerciseNames}
              onClick={() => navigate(`/programs/${program.id}/configure`)}
            />
          ))
        )}
      </CardWrapper>
      {/* Sheet for creating a new program */}
      {showSheet && (
        <SwiperSheet open={showSheet} onOpenChange={setShowSheet}>
            <SheetHeader className="text-left items-start">
              <SheetTitle className="text-left">What should we call this program?</SheetTitle>
              <SheetDescription className="text-left">Enter program name</SheetDescription>
            </SheetHeader>
            <Input
              label="Program name"
              value={programName}
              onChange={e => setProgramName(e.target.value)}
              placeholder="Enter program name"
              ref={inputRef}
              className="h-11 px-2.5 py-1 bg-stone-50 rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 text-left mt-4 mb-4"
            />
            <SheetFooter className="text-left items-start">
              <Button
                className="w-full text-left justify-start"
                disabled={!isReady}
                onClick={handleCreateProgram}
              >
                Create program
              </Button>
            </SheetFooter>
        </SwiperSheet>
      )}
    </AppLayout>
  );
};

export default ProgramsIndex;
