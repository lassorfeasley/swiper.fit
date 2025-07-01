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
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import AppLayout from "@/components/layout/AppLayout";
import ProgramCard from "@/components/common/Cards/ProgramCard";
import SwiperForm from "@/components/molecules/swiper-form";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import MainContentSection from "@/components/layout/MainContentSection";

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
            id,
            exercise_id,
            exercises ( name ),
            program_sets ( id )
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
      const programsWithExercises = (data || []).map((program) => {
        const setCount = (program.program_exercises || []).reduce(
          (total, pe) => total + (pe.program_sets ? pe.program_sets.length : 0),
          0
        );
        return {
          ...program,
          setCount,
          exerciseNames: (program.program_exercises || [])
            .map((pe) => pe.exercises?.name)
            .filter(Boolean),
        };
      });
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
      title="Programs"
      showAdd={true}
      showSearch={true}
      showAddButton={false}
      showBackButton={false}
      search={true}
      searchPlaceholder="Search programs or exercises"
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="programs"
      data-component="AppHeader"
      onAdd={() => {
        setShowSheet(true);
        setProgramName("");
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }}
    >
      <DeckWrapper paddingX={12} gap={20}>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No programs found.</div>
        ) : (
          filteredPrograms.map((program) => (
            <CardWrapper key={program.id} gap={0} marginTop={0} marginBottom={0}>
              <ProgramCard
                id={program.id}
                name={program.program_name}
                exerciseCount={(program.exerciseNames || []).length}
                setCount={program.setCount}
                leftText="Swipe to edit"
                swipeStatus="active"
                onSwipeComplete={() =>
                  navigate(`/programs/${program.id}/configure`)
                }
              />
            </CardWrapper>
          ))
        )}
      </DeckWrapper>

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
            label="Name program"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            ref={inputRef}
          />
        </SwiperForm.Section>
      </SwiperForm>
    </AppLayout>
  );
};

export default ProgramsIndex;
