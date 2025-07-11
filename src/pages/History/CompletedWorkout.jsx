// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-360

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import FormSectionWrapper from "@/components/common/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import SetEditForm from "@/components/common/forms/SetEditForm";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SetBadge from "@/components/molecules/SetBadge";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/contexts/AccountContext";

// Share dialog extracted outside of the component scope so it preserves identity between renders
const ShareWorkoutDialog = ({ open, onOpenChange, isPublic, onTogglePublic, shareUrl, onCopy }) => (
  <SwiperForm
    open={open}
    onOpenChange={onOpenChange}
    title="Share"
    leftAction={() => onOpenChange(false)}
    leftText="Close"
  >
    {/* Description section */}
    <SwiperForm.Section bordered={true} className="flex flex-col gap-5">
      <p className="text-base font-medium leading-tight font-vietnam text-slate-600">
        Publish your workout <span className="text-slate-300">to a public website that anyone you share the link with can view.</span>
      </p>
    </SwiperForm.Section>

    {/* Controls section */}
    <SwiperForm.Section bordered={false} className="flex flex-col gap-5">
      <SwiperFormSwitch
        label="Public link"
        checked={isPublic}
        onCheckedChange={onTogglePublic}
      />

      {isPublic && (
        <TextInput
          label="Click to copy"
          value={shareUrl}
          readOnly
          onFocus={(e) => e.target.select()}
          onClick={onCopy}
          icon={<Copy />}
        />
      )}
    </SwiperForm.Section>
  </SwiperForm>
);

ShareWorkoutDialog.displayName = "ShareWorkoutDialog";

// Individual Exercise Card Component
const ExerciseCompletedCard = ({ exercise, setLog, onEdit, readOnly = false }) => {
  const handleSetClick = (setIndex, set, e) => {
    if (readOnly || !onEdit) return;
    e.stopPropagation();
    onEdit(exercise.id, setIndex, set);
  };

  return (
    <div className="w-full p-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex flex-col justify-start items-start gap-4">
      {/* Exercise name and completion status */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <div className="flex-1 justify-start text-neutral-600 text-lg font-medium font-vietnam leading-tight">
          {exercise.exercise}
        </div>
        {setLog && setLog.length > 0 && (
          <div className="size-8 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
        )}
      </div>

      {/* Set badges */}
      {setLog && setLog.length > 0 && (
        <div className="w-full min-w-0 inline-flex justify-start items-center gap-3 flex-wrap content-center">
          {setLog.map((set, index) => (
            <SetBadge
              key={set.id || index}
              reps={set.reps}
              weight={set.weight}
              unit={set.unit}
              set_type={set.set_type}
              timed_set_duration={set.timed_set_duration}
              editable={!readOnly}
              onEdit={(e) => handleSetClick(index, set, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CompletedWorkout = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const { user } = useAuth();
  const location = useLocation();
  // Detect if we are on the public-share route  e.g. /history/public/workout/:workoutId
  const isPublicWorkoutView = location.pathname.startsWith("/history/public/workout/");
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSetExerciseId, setEditSetExerciseId] = useState(null);
  const [editSetIndex, setEditSetIndex] = useState(null);
  const [editFormValues, setEditFormValues] = useState({});
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [publicLink, setPublicLink] = useState(false);
  const [ownerHistoryPublic, setOwnerHistoryPublic] = useState(false);
  // Treat public view as read-only even if the owner is logged in
  const readOnly = isPublicWorkoutView || !user || (workout && workout.user_id !== user.id);
  const { isDelegated } = useAccount();
  const showSidebar = isOwner && !isPublicWorkoutView && !isDelegated;
  console.log('[CompletedWorkout] isDelegated:', isDelegated, 'showSidebar:', showSidebar);

  useEffect(() => {
    setIsOwner(user && workout && workout.user_id === user.id);
  }, [user, workout]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('[CompletedWorkout] Fetching workout with ID:', workoutId);
      setLoading(true);
      // Build workout query: owners can see their workouts; others can only see public ones
      let workoutQuery = supabase
        .from("workouts")
        // Use the explicit foreign-key relationship name to embed routine data
        .select("*, routines!workouts_routine_id_fkey(routine_name)")
        .eq("id", workoutId);

      const { data: workoutData, error: workoutError } = await workoutQuery.single();
      console.log('[CompletedWorkout] workoutData:', workoutData, 'workoutError:', workoutError);

      // If workout not found (e.g., not public), stop here
      if (workoutError || !workoutData) {
        setWorkout(null);
        setLoading(false);
        return;
      }
      setWorkout(workoutData);

      // Fetch only completed sets for this workout
      const { data: setsData, error: setsError } = await supabase
        .from("sets")
        .select("id, exercise_id, reps, weight, weight_unit, set_order, set_type, timed_set_duration, set_variant, status")
        .eq("workout_id", workoutId)
        .eq("status", "complete")
        .order("set_order", { ascending: true });
      console.log('[CompletedWorkout] setsData:', setsData, 'setsError:', setsError);

      // Only keep sets that have reps and weight logged and are valid numbers
      let dedupedMap = {};
      const validSets = (setsData || [])
        .filter((set) => {
          if (set.set_type === 'timed') {
            return (
              typeof set.timed_set_duration === 'number' &&
              !isNaN(set.timed_set_duration) &&
              set.timed_set_duration > 0
            );
          }
          return (
            typeof set.reps === 'number' &&
            !isNaN(set.reps) &&
            set.reps > 0
          );
        })
        .map((set) => {
          const unit = set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs');
          return {
            ...set,
            weight: unit === 'body' ? 0 : set.weight,
            unit,
            set_variant: set.set_variant ?? set.name ?? '',
          };
        })
        // de-dupe: for each exercise+order keep a single row, preferring one that has a non-null weight_unit
        .filter((row) => {
          const key = row.routine_set_id
            ? `rt-${row.routine_set_id}`
            : `${row.exercise_id}-${row.set_order || row.set_variant || ''}`;
          const existing = dedupedMap[key];
          if (!existing) {
            dedupedMap[key] = row;
            return true;
          }
          // prefer the one whose unit is 'body' or has a weight >0
          const takeCurrent = (row.unit === 'body' || row.weight > 0) && !(existing.unit === 'body' || existing.weight > 0);
          if (takeCurrent) {
            dedupedMap[key] = row;
          }
          return takeCurrent; // keep only the chosen row
        });
      console.log('[CompletedWorkout] validSets:', validSets);
      setSets(validSets);

      // Get unique exercise_ids from valid sets only
      const exerciseIds = [...new Set(validSets.map((s) => s.exercise_id))];

      // Fetch exercise names from snapshot table (with override)
      let exercisesObj = {};
      if (exerciseIds.length > 0) {
        const { data: snapData, error: snapErr } = await supabase
          .from("workout_exercises")
          .select(
            `exercise_id,
             snapshot_name,
             name_override,
             exercises!workout_exercises_exercise_id_fkey(
               name,
               section
             )`
          )
          .eq("workout_id", workoutId)
          .in("exercise_id", exerciseIds);
        if (snapErr) console.error('Error fetching snapshot names:', snapErr);
        // Build mapping from snapshot rows
        (snapData || []).forEach((row) => {
          // Prefer name_override, then snapshot_name, then the current exercises.name value
          const displayName = row.name_override || row.snapshot_name || (row.exercises || {}).name;
          const sec = (row.exercises || {}).section || "training";
          if (displayName) {
            exercisesObj[row.exercise_id] = { name: displayName, section: sec };
          }
        });

        // For any exerciseIds that still don't have a name (e.g., no snapshot row visible due to RLS)
        const missingIds = exerciseIds.filter((id) => !exercisesObj[id]);
        if (missingIds.length > 0) {
          const { data: exData, error: exErr } = await supabase
            .from("exercises")
            .select("id, name, section")
            .in("id", missingIds);
          if (exErr) {
            console.error('Error fetching fallback exercise names:', exErr);
          }
          (exData || []).forEach((row) => {
            exercisesObj[row.id] = { name: row.name, section: row.section || "training" };
          });
        }
      }
      setExercises(exercisesObj);
      setLoading(false);
    };
    if (workoutId) fetchData();
  }, [workoutId, user]);

  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.workout_name);
      setPublicLink(Boolean(workout.is_public));
    }
  }, [workout]);

  // Fetch owner name when not owner
  useEffect(() => {
    if (!workout || isOwner) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name", "last_name")
        .eq("id", workout.user_id)
        .single();
      if (data) {
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
        setOwnerName(name || "User");
      }
    })();
  }, [workout, isOwner]);

  // -------------------------------------------------------------
  // Fetch whether the workout owner's history is globally shared
  // (needed to decide whether to show a back button on public view)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isPublicWorkoutView || !workout) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("share_all_workouts")
        .eq("id", workout.user_id)
        .single();
      if (!error && data) {
        setOwnerHistoryPublic(Boolean(data.share_all_workouts));
      }
    })();
  }, [isPublicWorkoutView, workout]);

  // Group sets by exercise_id, but only include exercises that have valid sets
  const setsByExercise = {};
  sets.forEach((set) => {
    if (!setsByExercise[set.exercise_id]) {
      setsByExercise[set.exercise_id] = [];
    }
    setsByExercise[set.exercise_id].push(set);
  });

  // Filter out exercises that have no valid sets
  const exercisesWithSets = Object.entries(setsByExercise).filter(
    ([_, sets]) => sets.length > 0
  );

  // Filter exercises based on search
  const filteredExercisesWithSets = exercisesWithSets.filter(([exId, sets]) => {
    const exerciseName = exercises[exId]?.name || "[Exercise name]";
    return exerciseName.toLowerCase().includes(search.toLowerCase());
  });

  // Group exercises by section
  const exercisesBySection = useMemo(() => {
    const sectionGroups = {};
    
    filteredExercisesWithSets.forEach(([exId, exerciseSets]) => {
      const exInfo = exercises[exId] || { name: "[Exercise name]", section: "training" };
      const section = exInfo.section || "training";
      
      if (!sectionGroups[section]) {
        sectionGroups[section] = [];
      }
      
      sectionGroups[section].push({
        id: exId,
        exercise: exInfo.name,
        setLog: exerciseSets,
      });
    });

    // Convert to array and sort sections
    const sectionsOrder = ["warmup", "training", "cooldown"];
    return sectionsOrder
      .map(section => ({
        section,
        exercises: sectionGroups[section] || []
      }))
      .filter(group => group.exercises.length > 0);
  }, [filteredExercisesWithSets, exercises]);

  const handleSaveWorkoutName = async () => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ workout_name: workoutName })
        .eq("id", workoutId)
        .eq("user_id", user.id);

      if (error) throw error;
      setWorkout((prev) => ({ ...prev, workout_name: workoutName }));
      setEditWorkoutOpen(false);
    } catch (err) {
      toast.error("Failed to update workout name: " + err.message);
    }
  };

  const handleDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Manually delete associated sets first
      const { error: setsError } = await supabase
        .from("sets")
        .delete()
        .eq("workout_id", workoutId);

      if (setsError) {
        throw new Error(
          "Failed to delete associated sets: " + setsError.message
        );
      }

      // Then, delete the workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId)
        .eq("user_id", user.id);

      if (workoutError) {
        throw new Error("Failed to delete workout: " + workoutError.message);
      }

      // Navigate back to history
      navigate('/history');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle edits to sets within an exercise
  const handleSetConfigsChange = (exerciseId) => async (updatedConfigs) => {
    try {
      // Retrieve the existing sets for this exercise
      const originalConfigs = sets.filter(
        (s) => s.exercise_id === exerciseId
      );

      const updatedIds = updatedConfigs.map((c) => c.id);

      // Delete sets that were removed
      const toDelete = originalConfigs.filter(
        (c) => !updatedIds.includes(c.id)
      );
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from("sets")
          .delete()
          .in(
            "id",
            toDelete.map((s) => s.id)
          );
        if (delError) throw delError;
      }

      // Upsert (update) existing sets and insert new ones
      for (const cfg of updatedConfigs) {
        const { id, reps, weight, unit, set_type, timed_set_duration, set_variant } = cfg;
        if (id) {
          const { error: updError } = await supabase
            .from("sets")
            .update({
              reps,
              weight,
              weight_unit: unit,
              set_type,
              timed_set_duration,
              set_variant,
            })
            .eq("id", id);
          if (updError) throw updError;
        } else {
          const { error: insError } = await supabase
            .from("sets")
            .insert({
              workout_id: workoutId,
              exercise_id: exerciseId,
              reps,
              weight,
              weight_unit: unit,
              set_type,
              timed_set_duration,
              set_variant,
              order: 0, // Placeholder; you may want to calculate order properly
            });
          if (insError) throw insError;
        }
      }

      // Update local state
      setSets((prev) => {
        // Remove old records for this exercise
        const remainder = prev.filter((s) => s.exercise_id !== exerciseId);
        // Ensure each updated config has exercise_id
        const updatedWithExercise = updatedConfigs.map((c) => ({
          ...c,
          exercise_id: exerciseId,
        }));
        return [...remainder, ...updatedWithExercise];
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sets: " + err.message);
    }
  };

  const openSetEdit = (exerciseId, setIdx, setConfig) => {
    setEditSetExerciseId(exerciseId);
    setEditSetIndex(setIdx);
    setEditFormValues(setConfig);
    setCurrentFormValues(setConfig);
    setEditSheetOpen(true);
  };

  const handleEditFormSave = (values) => {
    if (editSetExerciseId === null || editSetIndex === null) return;
    // Build updated configs for this exercise
    const exerciseSets = sets.filter((s) => s.exercise_id === editSetExerciseId);
    const updatedConfigs = exerciseSets.map((cfg, idx) =>
      idx === editSetIndex ? { ...cfg, ...values } : cfg
    );
    handleSetConfigsChange(editSetExerciseId)(updatedConfigs);
    setEditSheetOpen(false);
  };

  const handleSetDelete = () => {
    if (editSetExerciseId === null || editSetIndex === null) return;
    const exerciseSets = sets.filter((s) => s.exercise_id === editSetExerciseId);
    const updatedConfigs = exerciseSets.filter((_, idx) => idx !== editSetIndex);
    handleSetConfigsChange(editSetExerciseId)(updatedConfigs);
    setEditSheetOpen(false);
  };

  const ensurePublic = async () => {
    if (!workout.is_public) {
      const { error } = await supabase
        .from('workouts')
        .update({ is_public: true })
        .eq('id', workoutId)
        .eq('user_id', user.id);
      if (error) throw error;
      setWorkout((prev) => ({ ...prev, is_public: true }));
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleTogglePublic = async (val) => {
    // Optimistic update: update local state immediately
    setPublicLink(val);
    try {
      await supabase
        .from('workouts')
        .update({ is_public: val })
        .eq('id', workoutId)
        .eq('user_id', user.id);
      setWorkout((prev) => ({ ...prev, is_public: val }));
      
      // Trigger static generation for crawler support
      try {
        await fetch('/api/trigger-static-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workoutId,
            isPublic: val
          })
        });
      } catch (triggerError) {
        console.warn('Failed to trigger static generation:', triggerError);
        // Don't show user error for this since it's not critical to core functionality
      }
    } catch (e) {
      // Revert on failure
      setPublicLink(!val);
      toast.error('Failed: ' + e.message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await ensurePublic();
      await navigator.clipboard.writeText(`${window.location.origin}/history/public/workout/${workoutId}`);
      toast.success('Link copied');
    } catch (e) {
      toast.error('Error copying: ' + e.message);
    }
  };



  return (
    <>
      <AppLayout
        variant="dark-fixed"
        title={isOwner ? workout?.workout_name : `${ownerName || "User"}'s ${workout?.workout_name}`}
        pageNameEditable={!readOnly || isDelegated}
        showShare={!isPublicWorkoutView && (isOwner || isDelegated)}
        onShare={handleShare}
        showSettings={!isPublicWorkoutView && ( !readOnly || isDelegated )}
        onSettings={() => setEditWorkoutOpen(true)}
        showBackButton={!isPublicWorkoutView || ownerHistoryPublic}
        onBack={() => {
          if (isPublicWorkoutView && workout) {
            navigate(`/history/public/${workout.user_id}`);
          } else {
            navigate('/history');
          }
        }}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
        showDeleteOption={!readOnly}
        onDelete={handleDeleteWorkout}
      >
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : workout ? (
          exercisesBySection.length > 0 ? (
            exercisesBySection.map(({ section, exercises: sectionExercises }, idx) => (
              <PageSectionWrapper
                key={section}
                section={section}
                grid
                deckGap={20}
                className={idx === exercisesBySection.length - 1 ? "flex-1" : ""}
                isSticky={true}
                stickyTopClass="top-0"
              >
                {sectionExercises.map((exercise) => (
                  <ExerciseCompletedCard
                    key={exercise.id}
                    exercise={exercise}
                    setLog={exercise.setLog}
                    onEdit={openSetEdit}
                    readOnly={readOnly}
                  />
                ))}
              </PageSectionWrapper>
            ))
          ) : (
            <div className="text-center py-10">
              <p>No sets were logged for this workout.</p>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p>Workout not found.</p>
          </div>
        )}
        <ShareWorkoutDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          isPublic={publicLink}
          shareUrl={`${window.location.origin}/history/public/workout/${workoutId}`}
          onCopy={handleCopyLink}
          onTogglePublic={handleTogglePublic}
        />
        <SwiperAlertDialog
          isOpen={isDeleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleConfirmDelete}
          title="Delete workout?"
          description="This workout and its sets will be deleted permanently."
          confirmText="Delete"
          cancelText="Cancel"
        />
        <SwiperForm
          open={isEditWorkoutOpen}
          onOpenChange={setEditWorkoutOpen}
          title="Edit"
          leftAction={() => setEditWorkoutOpen(false)}
          rightAction={handleSaveWorkoutName}
          rightEnabled={Boolean(workoutName.trim()) && workoutName.trim() !== (workout?.workout_name || "")}
          leftText="Cancel"
          rightText="Save"
        >
          <SwiperForm.Section>
            <TextInput
              label="Workout name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </SwiperForm.Section>

          <SwiperForm.Section bordered={false}>
            <SwiperButton
              variant="destructive"
              onClick={handleDeleteWorkout}
              className="w-full"
            >
              Delete workout
            </SwiperButton>
          </SwiperForm.Section>
        </SwiperForm>
        <SwiperForm
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          title="Edit Set"
          leftAction={() => setEditSheetOpen(false)}
          rightAction={() => handleEditFormSave(currentFormValues)}
          rightEnabled={formDirty}
          leftText="Cancel"
          rightText="Save"
        >
          <SetEditForm
            initialValues={editFormValues}
            onValuesChange={setCurrentFormValues}
            onDirtyChange={setFormDirty}
            showSetNameField={true}
            hideActionButtons={true}
            hideInternalHeader={true}
            isChildForm={true}
          />
        </SwiperForm>
      </AppLayout>
    </>
  );
};

export default CompletedWorkout;
