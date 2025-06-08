import React, { useRef, useEffect, useState, useContext } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/input";
import Icon from "@/components/common/Icon";
import ExerciseSetConfiguration from "@/components/common/forms/compound-fields/ExerciseSetConfiguration";
import { supabase } from "@/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { PageNameContext } from "@/App";
import CardWrapper from "@/components/common/CardsAndTiles/Cards/CardWrapper";
import MainContainer from "@/components/common/MainContainer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const CreateNewProgram = () => {
  const { setPageName } = useContext(PageNameContext);
  const { user } = useAuth();
  const [programName, setProgramName] = useState("");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  // Autofocus the input on mount
  useEffect(() => {
    setPageName("CreateNewProgram");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [setPageName]);

  const showFocusForm = !showAddExercise;
  const isReady = programName.trim().length > 0;

  // Handler for when the user submits the first exercise
  const handleAddExercise = async (exerciseData) => {
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

      // 2. Insert exercise (if not exists)
      let { data: existing, error: exError } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseData.name)
        .single();
      let exercise_id;
      if (existing && existing.id) {
        exercise_id = existing.id;
      } else {
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert([{ name: exerciseData.name }])
          .select("id, name")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }

      // 3. Insert into program_exercises (only valid columns)
      const { data: progEx, error: progExError } = await supabase
        .from("program_exercises")
        .insert({
          program_id,
          exercise_id,
          // exercise_order: 1, // Optionally add if you want ordering
        })
        .select()
        .single();
      if (progExError || !progEx) {
        console.error("program_exercises insert error:", progExError);
        throw new Error("Failed to link exercise to program");
      }
      const program_exercise_id = progEx.id;

      // 4. Insert into program_sets (use set_order, now include weight_unit)
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("program_sets")
          .insert(setRows);
        if (setError) throw new Error("Failed to save set details");
      }

      // Success: navigate to the new program configure page
      navigate(`/programs/${program_id}/configure`);
    } catch (err) {
      alert(err.message || "Failed to create program");
    }
  };

  return (
    <>
      <AppHeader
        appHeaderTitle="New program"
        subheadText="example subhead text"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      <div style={{ height: 140 }} />
      <CardWrapper>
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* (Removed placeholder text) */}
        </div>
        {/* Modal overlay on top of the page */}
        <Sheet
          open={showFocusForm}
          onOpenChange={() => setShowAddExercise(false)}
        >
          <SheetContent className="w-[300px] p-0">
            <SheetHeader className="px-3">
              <SheetTitle className="text-sm font-medium">
                What should we call this program?
              </SheetTitle>
            </SheetHeader>
            <div className="w-full outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start">
              <Input
                label="Program name"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Enter program name"
                inputRef={inputRef}
                className="h-11 px-2.5 py-1 bg-stone-50 rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300"
              />
            </div>
            <SheetFooter className="flex justify-end">
              <SheetTitle className="text-sm font-medium">
                {isReady ? (
                  <Icon
                    name="arrow_forward"
                    variant="outlined"
                    size={32}
                    className="text-black"
                  />
                ) : (
                  <Icon
                    name="arrow_forward"
                    variant="outlined"
                    size={32}
                    className="text-gray-300"
                  />
                )}
              </SheetTitle>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {showAddExercise && (
          <ExerciseSetConfiguration
            formPrompt="Add your first exercise"
            actionIconName="arrow_forward"
            onActionIconClick={handleAddExercise}
          />
        )}
      </CardWrapper>
    </>
  );
};

export default CreateNewProgram;
