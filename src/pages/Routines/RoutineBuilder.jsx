import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { PageNameContext } from "@/App";
import { FormHeader } from "@/components/atoms/sheet";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import ExerciseCard from "@/components/common/Cards/ExerciseCard";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperDialog from "@/components/molecules/swiper-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SectionNav from "@/components/molecules/section-nav";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { TextInput } from "@/components/molecules/text-input";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { Copy, Blend, X } from "lucide-react";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";
import { scrollToSection } from "@/lib/scroll";
import { useIsMobile } from "@/hooks/use-mobile";

const RoutineBuilder = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setPageName } = useContext(PageNameContext);
  const { isWorkoutActive, startWorkout } = useActiveWorkout();
  const { isDelegated, actingUser, returnToSelf } = useAccount();
  const isMobile = useIsMobile();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [isDeleteProgramConfirmOpen, setDeleteProgramConfirmOpen] =
    useState(false);
  const [isEditProgramOpen, setEditProgramOpen] = useState(false);
  const [isDeleteExerciseConfirmOpen, setDeleteExerciseConfirmOpen] =
    useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true); // All routines are now public
  const [sharing, setSharing] = useState(false);
  const [program, setProgram] = useState(null);

  const isUnmounted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  const [sectionFilter, setSectionFilter] = useState("workout");
  const [editingSet, setEditingSet] = useState(null);
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [isEditSetFormOpen, setIsEditSetFormOpen] = useState(false);
  const [editingSetFormDirty, setEditingSetFormDirty] = useState(false);
  const reorderTimeoutRef = useRef(null);
  const [addExerciseSection, setAddExerciseSection] = useState(null);
  // Helper to format delegate display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email;
  };

  // Full sharing nav row content matching Active Workout style
  const headerSharingContent = isDelegated ? (
    <>
      <div className="Frame73 max-w-[500px] pl-2 pr-5 bg-neutral-950 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-start items-center">
        <div className="Iconbutton w-10 h-10 p-2.5 flex justify-start items-center gap-2.5">
          <Blend className="w-6 h-6 text-white" />
        </div>
        <div className="Frame71 flex justify-center items-center gap-5">
          <div className="AccountOwnersName justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {formatUserDisplay(actingUser)}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Exit delegate mode"
        onClick={returnToSelf}
        className="ActionIcons w-10 h-10 p-2 bg-neutral-950 rounded-3xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </>
  ) : undefined;


  useEffect(() => {
    setPageName("RoutineBuilder");
  }, [setPageName]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    async function fetchProgramAndExercises() {
      setLoading(true);
      const { data: programData } = await supabase
        .from("routines")
        .select("routine_name, is_public, og_image_url")
        .eq("id", programId)
        .single();
      setProgramName(programData?.routine_name || "");
      setIsPublic(true); // All routines are now public
      setProgram(programData);
      console.log('Program data:', programData);
      console.log('OG Image URL:', programData?.og_image_url);


      const { data: progExs, error } = await supabase
        .from("routine_exercises")
        .select(
          `id,
           exercise_id,
           exercise_order,
           exercises!fk_routine_exercises__exercises(
             name,
             section
           ),
           routine_sets!fk_routine_sets__routine_exercises(
             id,
             reps,
             weight,
             weight_unit,
             set_order,
             set_variant,
             set_type,
             timed_set_duration
           )`
        )
        .eq("routine_id", programId)
        .order("exercise_order", { ascending: true });
      if (error) {
        setExercises([]);
        setLoading(false);
        return;
      }
      const items = (progExs || []).map((pe) => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        name: pe.exercises?.name || "[Exercise name]",
        section: pe.exercises?.section || "training",
        sets: pe.routine_sets?.length || 0,
        order: pe.exercise_order || 0,
        setConfigs: (pe.routine_sets || [])
          .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
          .map((set) => {
            const unit = set.weight_unit || 'lbs';
            return {
              reps: set.reps,
              weight: set.weight,
              unit,
              set_variant: set.set_variant || `Set ${set.set_order}`,
              set_type: set.set_type,
              timed_set_duration: set.timed_set_duration,
            };
          }),
      }));
      setExercises(items);
      
      // Generate OG image if it doesn't exist
      if (!programData?.og_image_url) {
        try {
          console.log('No OG image found, generating one...');
          
          // Calculate routine metrics
          const exerciseCount = items.length;
          const setCount = items.reduce((total, ex) => total + (ex.setConfigs?.length || 0), 0);
          
          // Import the generation function
          const { generateAndUploadRoutineOGImage } = await import('@/lib/ogImageGenerator');
          
          const routineData = {
            routineName: programData.routine_name,
            ownerName: '', // We'll need to get this from user context
            exerciseCount,
            setCount
          };
          
          const imageUrl = await generateAndUploadRoutineOGImage(programId, routineData);
          
          // Update the program state with the new image URL
          setProgram(prev => ({ ...prev, og_image_url: imageUrl }));
          console.log('Generated OG image:', imageUrl);
        } catch (error) {
          console.error('Failed to generate OG image:', error);
        }
      }
      
      // Automatically open add exercise form when no exercises exist
      if (items.length === 0) {
        setShowAddExercise(true);
      }
      setLoading(false);
    }
    fetchProgramAndExercises();
    return () => {
      isUnmounted.current = true;
      saveOrder();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const handleEditSet = (index, setConfig) => {
    setEditingSet(setConfig);
    setEditingSetIndex(index);
    setIsEditSetFormOpen(true);
  };

  const handleSetEditFormSave = (values) => {
    if (editingExercise) {
      const newSetConfigs = [...editingExercise.setConfigs];
      newSetConfigs[editingSetIndex] = values;
      setEditingExercise({
        ...editingExercise,
        setConfigs: newSetConfigs,
      });
    }
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetEditFormClose = () => {
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetDelete = () => {
    if (editingExercise && editingSetIndex !== null) {
      const newSetConfigs = [...(editingExercise.setConfigs || [])];
      newSetConfigs.splice(editingSetIndex, 1);
      
      // Update the editing exercise
      const updatedExercise = {
        ...editingExercise,
        setConfigs: newSetConfigs,
      };
      setEditingExercise(updatedExercise);
      
      // Also update the main exercises list
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === editingExercise.id
            ? { ...ex, setConfigs: newSetConfigs }
            : ex
        )
      );
      
      // Save to database
      handleSetConfigsChange(editingExercise.exercise_id, newSetConfigs);
    }
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const saveOrder = async () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await supabase
        .from("routine_exercises")
        .update({ exercise_order: i + 1 })
        .eq("id", ex.id);
    }
  };

  // Handler for reordering exercises within a section
  // Debounced database update function
  const updateExerciseOrderInDatabase = useCallback(async (exercisesToUpdate) => {
    try {
      // First, set all exercises to temporary negative order values to avoid constraint conflicts
      for (const ex of exercisesToUpdate) {
        const { error } = await supabase
          .from("routine_exercises")
          .update({ exercise_order: -ex.order }) // Use negative values as temporary
          .eq("id", ex.id);
        
        if (error) {
          console.error(`Failed to update exercise ${ex.id} to temporary order:`, error);
          return; // Stop if we can't set temporary values
        }
      }
      
      // Then, set the final positive order values
      for (const ex of exercisesToUpdate) {
        const { error } = await supabase
          .from("routine_exercises")
          .update({ exercise_order: ex.order })
          .eq("id", ex.id);
        
        if (error) {
          console.error(`Failed to update exercise ${ex.id} to final order:`, error);
          // Continue with other updates even if one fails
        }
      }
    } catch (error) {
      console.error("Failed to save exercise order:", error);
      // Could add toast notification here
    }
  }, []);

  const handleReorderExercises = (section) => (newOrder) => {
    const target = section === "workout" ? "training" : section;
    
    // Update local state first for immediate UI feedback
    setExercises(prev => {
      // Get exercises from other sections
      const otherSectionExercises = prev.filter(ex => ex.section !== target);
      
      // Update order numbers for the reordered section
      const reorderedWithNewOrder = newOrder.map((ex, index) => ({
        ...ex,
        order: index + 1 // Simple 1-based ordering within section
      }));
      
      // Combine all exercises and sort by section priority then order
      const allExercises = [...otherSectionExercises, ...reorderedWithNewOrder];
      
      return allExercises;
    });

    // Clear any existing timeout
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }

    // Debounce the database update - only save after user stops dragging for 300ms
    reorderTimeoutRef.current = setTimeout(() => {
      const exercisesToUpdate = newOrder.map((ex, index) => ({
        id: ex.id,
        order: index + 1
      }));
      updateExerciseOrderInDatabase(exercisesToUpdate);
    }, 300);
  };

  const handleBack = () => {
    saveOrder();
    if (location.state && location.state.fromPublicImport) {
      navigate('/routines');
    } else {
      navigate(-1);
    }
  };

  const handleOpenAddExercise = (section) => {
    setAddExerciseSection(section);
    setShowAddExercise(true);
  };
  
  const openShareDialog = () => {
    setShareDialogOpen(true);
  };


  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/routines/public/${programId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch (e) {
      console.error("Failed to copy share link", e);
      toast.error("Failed to copy link");
    }
  };


  const shareRoutine = async () => {
    setSharing(true);
    try {
      // Ensure routine is public
      if (!isPublic) {
        await supabase
          .from("routines")
          .update({ is_public: true })
          .eq("id", programId);
        setIsPublic(true);
      }

      const url = `${window.location.origin}/routines/public/${programId}`;
      const title = programName || 'Routine';
      const text = title;

      // Prefer native share whenever available
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (shareErr) {
          // Swallow user cancellations or share errors
        } finally {
          setSharing(false);
        }
        return;
      }

      // Desktop/unsupported fallback: copy URL only
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } catch (copyErr) {
        try {
          // Legacy execCommand fallback
          const tmp = document.createElement('input');
          tmp.style.position = 'fixed';
          tmp.style.opacity = '0';
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
          toast.success('Link copied');
        } catch {
          toast.message('Share this link:', { description: url });
        }
      }
    } finally {
      setSharing(false);
    }
  };

  const handleStartWorkout = () => {
    // Create a routine object with exercises data to pass to startWorkout
    // Convert our exercises format to the format expected by ActiveWorkout
    const routine_exercises = exercises.map((ex) => ({
      id: ex.id,
      exercise_id: ex.exercise_id,
      exercises: {
        name: ex.name,
        section: ex.section
      },
      routine_sets: ex.setConfigs.map((config, index) => ({
        id: `${ex.id}-set-${index}`, // Generate a unique ID for each set
        reps: config.reps,
        weight: config.weight,
        weight_unit: config.unit,
        set_order: index + 1,
        set_variant: config.set_variant,
        set_type: config.set_type,
        timed_set_duration: config.timed_set_duration,
      }))
    }));

    const routine = {
      id: programId,
      routine_name: programName,
      routine_exercises: routine_exercises,
    };
    
    console.log('[RoutineBuilder] handleStartWorkout invoked for routine:', routine);
    
    // Users should never be able to access this page with an active workout due to redirect logic
    // If they somehow do, just start the workout (this will end the current one)
    startWorkout(routine)
      .then(() => navigate("/workout/active"))
      .catch((error) => {
        console.error('[RoutineBuilder] startWorkout error for routine', routine, error);
        toast.error('Failed to start workout: ' + error.message);
      });
  };



  const handleAddExercise = async (exerciseData) => {
    try {
      let { data: existing } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseData.name)
        .maybeSingle();
      let exercise_id = existing?.id;
      if (!exercise_id) {
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert([{ name: exerciseData.name, section: exerciseData.section || "training" }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }
      // Check if this exercise is already in the routine
      const { data: existingRoutineExercise } = await supabase
        .from("routine_exercises")
        .select("id")
        .eq("routine_id", programId)
        .eq("exercise_id", exercise_id)
        .maybeSingle();

      if (existingRoutineExercise) {
        throw new Error("This exercise is already in the routine");
      }

      // Get the next available exercise_order to avoid conflicts
      const { data: maxOrderResult } = await supabase
        .from("routine_exercises")
        .select("exercise_order")
        .eq("routine_id", programId)
        .order("exercise_order", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrderResult?.exercise_order || 0) + 1;

      const { data: progEx, error: progExError } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: programId,
          exercise_id,
          exercise_order: nextOrder,
        })
        .select("id")
        .single();
      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        routine_exercise_id: program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${idx + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("routine_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to save set details: " + setError.message);
      }
      setShowAddExercise(false);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      await supabase
        .from("exercises")
        .update({ name: exerciseData.name, section: exerciseData.section })
        .eq("id", editingExercise.exercise_id);
      await supabase
        .from("routine_sets")
        .delete()
        .eq("routine_exercise_id", editingExercise.id);
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        routine_exercise_id: editingExercise.id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${idx + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("routine_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to update set details: " + setError.message);
      }
      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to update exercise");
    }
  };

  const handleDeleteExercise = () => {
    if (!editingExercise) return;
    setDeleteExerciseConfirmOpen(true);
  };

  const handleConfirmDeleteExercise = async () => {
    try {
      if (!editingExercise) return;

      // Delete the program exercise and its associated sets
      const { error: deleteError } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", editingExercise.id);

      if (deleteError) throw deleteError;

      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this exercise because it is used by other routines or has logged sets.');
      } else {
        alert(err.message || 'Failed to delete exercise');
      }
    } finally {
      setDeleteExerciseConfirmOpen(false);
    }
  };

  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from("routine_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         exercises!fk_routine_exercises__exercises(
           name,
           section
         ),
         routine_sets!fk_routine_sets__routine_exercises(
           id,
           reps,
           weight,
           weight_unit,
           set_order,
           set_variant,
           set_type,
           timed_set_duration
         )`
      )
      .eq("routine_id", programId)
      .order("exercise_order", { ascending: true });
    const items = (progExs || []).map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: pe.exercises?.name || "[Exercise name]",
      section: pe.exercises?.section || "training",
      sets: pe.routine_sets?.length || 0,
      order: pe.exercise_order || 0,
      setConfigs: (pe.routine_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => {
          const unit = set.weight_unit || 'lbs';
          return {
            reps: set.reps,
            weight: set.weight,
            unit,
            set_variant: set.set_variant || `Set ${set.set_order}`,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
          };
        }),
    }));
    setExercises(items);
  };

  const searchFiltered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const SECTION_KEYS = ["warmup", "workout", "cooldown"];

  const exercisesBySection = SECTION_KEYS.map((key) => {
    const target = key === "workout" ? "training" : key;
    const items = searchFiltered
      .filter((ex) => ex.section === target)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { section: key, exercises: items };
  });

  const scrollSectionIntoView = (key) => {
    scrollToSection(`section-${key}`);
  };

  const handleModalClose = () => {
    setShowAddExercise(false);
    setEditingExercise(null);
    setAddExerciseSection(null);
  };

  // Handler to update setConfigs for an exercise and persist to Supabase
  const handleSetConfigsChange = async (exerciseId, newSetConfigs) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId
          ? { ...ex, setConfigs: newSetConfigs }
          : ex
      )
    );
    // Find the program_exercise_id for this exercise
    const programExercise = exercises.find(
      (ex) => ex.exercise_id === exerciseId
    );
    if (!programExercise) return;
    const program_exercise_id = programExercise.id;
    // Delete old sets
    await supabase
      .from("routine_sets")
      .delete()
      .eq("routine_exercise_id", program_exercise_id);
    // Insert new sets
    const setRows = (newSetConfigs || []).map((cfg, idx) => ({
      routine_exercise_id: program_exercise_id,
      set_order: idx + 1,
      reps: Number(cfg.reps),
      weight: Number(cfg.weight),
      weight_unit: cfg.unit,
      set_variant: cfg.set_variant || `Set ${idx + 1}`,
      set_type: cfg.set_type,
      timed_set_duration: cfg.timed_set_duration,
    }));
    if (setRows.length > 0) {
      await supabase.from("routine_sets").insert(setRows);
    }
  };

  const handleTitleChange = async (newTitle) => {
    setProgramName(newTitle);
    await supabase
      .from("routines")
      .update({ routine_name: newTitle })
      .eq("id", programId);
    setEditProgramOpen(false);
  };

  const handleDeleteProgram = () => {
    setDeleteProgramConfirmOpen(true);
    setEditProgramOpen(false);
  };

  const handleConfirmDeleteProgram = async () => {
    try {
      const { error } = await supabase
        .from("routines")
        .update({ is_archived: true })
        .eq("id", programId);

      if (error) throw error;

      navigate("/routines");
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this routine because it has associated workouts.');
      } else {
        alert('Failed to delete routine: ' + err.message);
      }
    }
  };



  return (
    <>
      <AppLayout
        hideHeader={false}
        hideDelegateHeader={true}
        title={programName || "Build your routine"}
        variant="glass"
        sharingNavAbove={isDelegated}
        sharingNavContent={headerSharingContent}
        showBackButton={true}
        onBack={handleBack}
        showShare={true}
        onShare={shareRoutine}
        showSettings={true}
        onSettings={() => setEditProgramOpen(true)}
        showDelete={true}
        onDelete={() =>	setDeleteProgramConfirmOpen(true)}
        showSidebar={!isDelegated && !isMobile}
        sharingSection={undefined}
      >
        <div className="flex flex-col min-h-screen" style={{ paddingTop: 'calc(var(--header-height) + 20px)' }}>
          {/* Routine Image Section */}
          <div className="self-stretch inline-flex flex-col justify-start items-center">
            <div className="self-stretch px-5 inline-flex justify-center items-center gap-5">
              <div 
                className="w-full max-w-[500px] rounded-[20px] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 overflow-hidden cursor-pointer"
                onClick={shareRoutine}
              >
                <img 
                  className="w-full h-auto block" 
                  src={program?.og_image_url || "https://placehold.co/500x262"} 
                  alt={`${programName} routine`}
                  draggable={false}
                  onError={(e) => {
                    console.log('Image failed to load:', program?.og_image_url);
                    e.target.src = "https://placehold.co/500x262";
                  }}
                  onLoad={() => console.log('Image loaded successfully:', program?.og_image_url)}
                />
              </div>
            </div>
          </div>
          
          {exercisesBySection.map(({ section, exercises: secExercises }, index) => (
          <PageSectionWrapper
            key={section}
            section={section} 
            id={`section-${section}`} 
            deckGap={0} 
            deckVariant="cards"
            reorderable={true}
            items={secExercises}
            onReorder={handleReorderExercises(section)}
            isFirst={section === "warmup"}
            className={`${section === "warmup" ? "border-t-0" : ""} ${index === exercisesBySection.length - 1 ? "flex-1" : ""}`}
            backgroundClass="bg-transparent"
            showPlusButton={true}
            onPlus={() => handleOpenAddExercise(section)}
            style={{ paddingBottom: 0, paddingTop: 40, maxWidth: '500px', minWidth: '0px' }}
          >
            {secExercises.length === 0 && !loading ? (
              <div className="text-gray-400 text-center py-8">
                No exercises found. Try adding one!
              </div>
            ) : loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : secExercises.map((ex, exIndex) => (
              <div key={ex.id} className="w-full" style={{ marginBottom: exIndex < secExercises.length - 1 ? '12px' : '0px' }}>
                <ExerciseCard
                  mode="default"
                  exerciseName={ex.name}
                  setConfigs={ex.setConfigs}
                  onEdit={() => setEditingExercise(ex)}
                  onSetConfigsChange={(newSetConfigs) =>
                    handleSetConfigsChange(ex.exercise_id, newSetConfigs)
                  }
                  onCardClick={() => setEditingExercise(ex)}
                />
              </div>
            ))}
          </PageSectionWrapper>
        ))}
        </div>
        <SwiperForm
          open={showAddExercise || !!editingExercise}
          onOpenChange={(open) => {
            handleModalClose();
          }}
          title={showAddExercise ? "Exercise" : "Edit"}
          description={
            showAddExercise 
              ? "Add a new exercise to your routine with name, section, and sets" 
              : "Edit exercise details including name, section, and sets"
          }
          leftAction={handleModalClose}
          rightAction={() => formRef.current.requestSubmit()}
          rightEnabled={dirty}
          className="add-exercise-drawer"
        >
          <div className="flex flex-col h-full overflow-y-scroll md:overflow-y-auto">
            <div className="overflow-y-scroll md:overflow-auto h-[650px] md:h-full">
              <AddNewExerciseForm
                ref={formRef}
                key={editingExercise ? editingExercise.id : "add-new"}
                formPrompt={
                  showAddExercise ? "Add a new exercise" : "Edit exercise"
                }
                onActionIconClick={
                  showAddExercise ? handleAddExercise : handleEditExercise
                }
                onDelete={editingExercise ? handleDeleteExercise : undefined}
                initialName={editingExercise?.name}
                initialSection={
                  showAddExercise
                    ? addExerciseSection === "workout" || addExerciseSection === "training"
                      ? "training"
                      : addExerciseSection
                    : editingExercise?.section
                }
                initialSets={editingExercise?.setConfigs?.length}
                initialSetConfigs={editingExercise?.setConfigs}
                onDirtyChange={setDirty}
                hideActionButtons
                showAddToProgramToggle={false}
                hideSetDefaults={!!editingExercise}
                onEditSet={handleEditSet}
              />
              {editingExercise && (
                <div className="flex flex-col gap-3 py-4 px-4">
                  <SwiperButton
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteExercise}
                  >
                    Delete exercise
                  </SwiperButton>
                </div>
              )}
            </div>
          </div>
        </SwiperForm>
        
        {/* Start Workout Button - Absolutely positioned at bottom */}
        {!isDelegated && (
          <div className={`fixed bottom-0 left-0 right-0 z-40 flex justify-center items-center px-5 pb-5 bg-[linear-gradient(to_bottom,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)] ${!isMobile && !isDelegated ? 'md:left-64' : ''}`} style={{ paddingBottom: '20px' }}>
            <div 
              className="w-full max-w-[500px] h-14 pl-2 pr-5 bg-green-600 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(212,212,212,1.00)] backdrop-blur-[1px] inline-flex justify-start items-center cursor-pointer"
              onClick={handleStartWorkout}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStartWorkout?.(); } }}
              aria-label="Start workout"
            >
              <div className="p-2.5 flex justify-start items-center gap-2.5">
                <div className="relative">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3L20 12L5 21V3Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex justify-center items-center gap-5">
                <div className="justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Start workout</div>
              </div>
            </div>
          </div>
        )}
      </AppLayout>

      {/* Share Routine Sheet */}
      <SwiperForm
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="Share"
        leftAction={() => setShareDialogOpen(false)}
        leftText="Close"
      >
        <SwiperForm.Section bordered={true} className="flex flex-col gap-5">
          <p className="text-base font-medium leading-tight font-vietnam text-slate-600">
            Publish your routine <span className="text-slate-300">to a public website that anyone you share the link with can view.</span>
          </p>
        </SwiperForm.Section>

        <SwiperForm.Section bordered={false} className="flex flex-col gap-5">
          <TextInput
            label="Click to copy"
            value={`${window.location.origin}/routines/public/${programId}`}
            readOnly
            onFocus={(e) => e.target.select()}
            onClick={handleCopyLink}
            icon={<Copy />}
          />
        </SwiperForm.Section>
      </SwiperForm>

      <SwiperForm
        open={isEditProgramOpen}
        onOpenChange={setEditProgramOpen}
        title="Edit"
        description="Edit routine name and manage program settings"
        leftAction={() => setEditProgramOpen(false)}
        leftText="Cancel"
        rightAction={() => handleTitleChange(programName)}
        rightText="Save"
      >
        <SwiperForm.Section>
          <TextInput
            label="Routine name"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
        </SwiperForm.Section>
        <SwiperForm.Section bordered={false}>
          <SwiperButton
            variant="destructive"
            onClick={handleDeleteProgram}
            className="w-full"
          >
            Delete program
          </SwiperButton>
        </SwiperForm.Section>
      </SwiperForm>

      <SwiperForm
        open={isEditSetFormOpen}
        onOpenChange={setIsEditSetFormOpen}
        title="Edit"
        description="Edit set configuration including type, reps, weight, and unit"
        leftAction={handleSetEditFormClose}
        rightAction={() => handleSetEditFormSave(editingSet)}
        rightEnabled={editingSetFormDirty}
        rightText="Save"
        leftText="Cancel"
        padding={0}
      >
        <SetEditForm
          hideInternalHeader
          hideActionButtons
          hideToggle={true}
          onDirtyChange={setEditingSetFormDirty}
          onValuesChange={setEditingSet}
          onDelete={handleSetDelete}
          initialValues={editingSet}
        />
      </SwiperForm>

      <SwiperDialog
        open={isDeleteProgramConfirmOpen}
        onOpenChange={setDeleteProgramConfirmOpen}
        onConfirm={handleConfirmDeleteProgram}
        title="Delete routine?"
        confirmText="Delete forever"
        cancelText="Cancel"
        confirmVariant="destructive"
        cancelVariant="outline"
      />
      <SwiperDialog
        open={isDeleteExerciseConfirmOpen}
        onOpenChange={setDeleteExerciseConfirmOpen}
        onConfirm={() => setDeleteExerciseConfirmOpen(false)}
        onCancel={handleConfirmDeleteExercise}
        title="Delete Exercise"
        confirmText="Cancel"
        cancelText="Delete"
        confirmVariant="outline"
        cancelVariant="destructive"
        contentClassName="w-[1340px] h-[866px] inline-flex flex-col justify-center items-center"
        headerClassName="w-full flex-1 max-w-[400px] border-l border-r border-neutral-neutral-300 flex flex-col justify-center items-center gap-2.5"
        titleClassName="self-stretch h-12 px-3 bg-white border-t border-b border-neutral-neutral-300 flex flex-col justify-center items-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight"
        footerClassName="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4"
      />

    </>
  );
};

export default RoutineBuilder;
