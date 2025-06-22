// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=48-601

import { supabase } from "@/supabaseClient";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader, SheetTitle, SheetFooter } from "@/components/atoms/sheet";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import AppLayout from "@/components/layout/AppLayout";
import StaticCard from "@/components/organisms/static-card";
import DrawerManager from "@/components/organisms/drawer-manager";

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
        .select(
          `
          id,
          program_name,
          program_exercises (
            exercise_id,
            exercises ( name )
          )
        `
        )
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // Map exercises for each program
      const programsWithExercises = (data || []).map((program) => ({
        ...program,
        exerciseNames: (program.program_exercises || [])
          .map((pe) => pe.exercises?.name)
          .filter(Boolean),
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
      setRefreshFlag((f) => f + 1);
      navigate(`/programs/${program_id}/configure`);
    } catch (err) {
      alert(err.message || "Failed to create program");
    }
  };

  const isReady = programName.trim().length > 0;

  // Filter programs by search
  const filteredPrograms = programs.filter((program) => {
    const q = search.toLowerCase();
    return (
      program.program_name?.toLowerCase().includes(q) ||
      (program.exerciseNames &&
        program.exerciseNames.some((name) => name.toLowerCase().includes(q)))
    );
  });

  return (
    <AppLayout
      appHeaderTitle="Programs"
      showAddButton={true}
      addButtonText="Add program"
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
      pageContext="programs"
      data-component="AppHeader"
    >
      <CardWrapper>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No programs found.
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <StaticCard
              key={program.id}
              name={program.program_name}
              labels={program.exerciseNames}
              onClick={() => navigate(`/programs/${program.id}/configure`)}
            />
          ))
        )}
      </CardWrapper>

      <DrawerManager
        open={showSheet}
        onOpenChange={setShowSheet}
        title=""
        leftAction={() => setShowSheet(false)}
        rightAction={handleCreateProgram}
        rightEnabled={isReady}
        rightText="Add"
        leftText="Cancel"
      >
        <SheetTitle className="text-center mt-6 mb-2">
          What should we call this program?
        </SheetTitle>
        <Input
          label="Program name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="Enter program name"
          ref={inputRef}
          className="h-11 px-2.5 py-1 bg-stone-50 rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 text-left mt-4 mb-4"
        />
        <SheetFooter className="text-left items-start mb-8">
          <Button
            className="w-full text-left justify-start"
            disabled={!isReady}
            onClick={handleCreateProgram}
          >
            Create program
          </Button>
        </SheetFooter>
      </DrawerManager>
    </AppLayout>
  );
};

export default ProgramsIndex;
