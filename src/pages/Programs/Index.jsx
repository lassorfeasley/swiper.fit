// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=48-601&t=YBjXtsLhxGedobad-4

import { supabase } from "@/supabaseClient";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { PageNameContext } from "@/App";
import ProgramCard from '@/components/common/Cards/ProgramCard';
import { useQuery } from "@tanstack/react-query";
import MainContainer from "@/components/layout/MainContainer";
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import Icon from "@/components/molecules/Icon";
import { Button } from "@/components/ui/button";
import NumericInput from "@/components/molecules/numeric-input";
import WeightCompoundField from "@/components/common/forms/WeightCompoundField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';

const ProgramsIndex = () => {
  const { setPageName } = useContext(PageNameContext);
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [programName, setProgramName] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(0);
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
      // Fetch only programs for this user
      const { data: programsData, error } = await supabase
        .from("programs")
        .select("id, program_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // For each program, fetch the number of exercises
      const programsWithCounts = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count, error: countError } = await supabase
            .from("program_exercises")
            .select("id", { count: "exact", head: true })
            .eq("program_id", program.id);
          return {
            ...program,
            exerciseCount: countError ? 0 : count,
            editable: true, // You can add logic for editability if needed
          };
        })
      );
      setPrograms(programsWithCounts);
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

  return (
    <div className="flex flex-col h-screen">
      <AppHeader
        appHeaderTitle="Programs"
        actionBarText="Create new program"
        showActionBar={true}
        showActionIcon={true}
        showBackButton={false}
        subhead={false}
        search={true}
        searchPlaceholder="Search programs"
        onAction={() => {
          setShowSheet(true);
          setProgramName("");
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 100);
        }}
        data-component="AppHeader"
      />
      <CardWrapper className="px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : programs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No programs found.
          </div>
        ) : (
          programs.map((program) => (
            <ProgramCard
              key={program.id}
              programName={program.program_name}
              exerciseCount={program.exerciseCount}
              onClick={() => navigate(`/programs/${program.id}/configure`)}
            />
          ))
        )}
      </CardWrapper>
      {/* Sheet for creating a new program */}
      {showSheet && (
        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetContent className="w-[350px] p-6">
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
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ProgramsIndex;
