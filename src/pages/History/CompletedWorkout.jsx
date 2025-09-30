// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-360

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/AccountContext";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperDialog from "@/components/molecules/swiper-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import FormSectionWrapper from "@/components/common/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import WorkoutSummaryCard from "@/components/common/Cards/WorkoutSummaryCard";

import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import { toast } from "sonner";
import { Blend, Star, Copy, Check, Repeat2, Weight, Clock } from "lucide-react";
import { generateAndUploadOGImage } from '@/lib/ogImageGenerator';

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
const ExerciseCompletedCard = ({ exercise, setLog }) => {

  // Get set names from database or fallback to default
  const getSetName = (index, set) => {
    return set.set_variant || `Set ${index + 1}`;
  };

  // Format time for timed sets
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      data-layer="Property 1=completed-workout" 
      className="w-full bg-white inline-flex flex-col justify-start items-start overflow-hidden border-b border-neutral-300"
    >
        {/* Header */}
        <div data-layer="Frame 61" className="self-stretch pl-3 bg-neutral-50 border-b border-neutral-300 inline-flex justify-start items-center gap-4">
          <div data-layer="Exercise name" className="flex-1 justify-start text-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {exercise.exercise}
          </div>
          <div data-layer="IconButton" className="p-2.5 flex justify-start items-center gap-2.5">
            <div className="size-6 relative overflow-hidden flex items-center justify-center">
              <Check className="size-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Set rows */}
        {setLog && setLog.length > 0 && (
          <>
            {setLog.map((set, idx) => (
              <div 
                key={set.id || idx}
                data-layer="card-row" 
                className="self-stretch h-11 pl-3 border-b border-neutral-100 border-b-[0.25px] inline-flex justify-between items-center overflow-hidden"
              >
                <div data-layer="Set name" className="justify-start text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  {getSetName(idx, set)}
                </div>
                <div data-layer="metrics" className="self-stretch min-w-12 flex justify-start items-center gap-px overflow-hidden">
                  {/* First metric: Reps or Time */}
                  <div data-layer="rep-type" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div data-layer="rep-type-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                      {set.set_type === 'timed' ? (
                        <Clock className="size-4 text-neutral-500" strokeWidth={1.5} />
                      ) : (
                        <Repeat2 className="size-4 text-neutral-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div data-layer="rep-type-metric" className="text-center justify-center text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {set.set_type === 'timed' ? formatTime(set.timed_set_duration || 0) : (set.reps || 0)}
                    </div>
                  </div>
                  {/* Weight */}
                  <div data-layer="rep-weight" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div data-layer="rep-weight-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                      <Weight className="size-4 text-neutral-500" strokeWidth={1.5} />
                    </div>
                    <div data-layer="rep-weight-metric" className="text-center justify-center text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {(set.weight_unit || set.unit) === 'body' ? 'BW' : (set.weight || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
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
  const currentUser = useCurrentUser(); // Use delegation-aware user context
  const location = useLocation();
  // Detect if we are on the public-share route  e.g. /history/public/workout/:workoutId
  const isPublicWorkoutView = location.pathname.startsWith("/history/public/workout/");

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [publicLink, setPublicLink] = useState(false);
  const [ownerHistoryPublic, setOwnerHistoryPublic] = useState(false);
  const ogAttemptedRef = useRef(false);

  const { isDelegated } = useAccount();
  const showSidebar = isOwner && !isPublicWorkoutView && !isDelegated;

  const openShareSettings = () => setShareDialogOpen(true);
  console.log('[CompletedWorkout] isDelegated:', isDelegated, 'showSidebar:', showSidebar);

  // Sharing busy state
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setIsOwner(user && workout && workout.user_id === currentUser?.id);
  }, [user, currentUser, workout]);

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
        // Include routine_set_id so deduplication can collapse template-based duplicates
        .select("id, exercise_id, reps, weight, weight_unit, set_order, set_type, timed_set_duration, set_variant, status, routine_set_id")
        .eq("workout_id", workoutId)
        .eq("status", "complete")
        .order("set_order", { ascending: true });
      console.log('[CompletedWorkout] setsData:', setsData, 'setsError:', setsError);

      // Only keep sets that have reps and weight logged and are valid numbers
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
          const unit = set.weight_unit || 'lbs';
          return {
            ...set,
            weight: set.weight,
            unit,
            set_variant: set.set_variant ?? set.name ?? '',
          };
        });
      
      // Remove any true duplicates (same id) that might exist due to query issues
      const deduped = validSets.filter((set, index, arr) => 
        arr.findIndex(s => s.id === set.id) === index
      );
      
      console.log('[CompletedWorkout] validSets:', validSets);
      setSets(deduped);

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

      // Fallback: if this completed workout has no og_image_url, generate now using valid sets
      try {
        if (!ogAttemptedRef.current && workoutData && !workoutData.og_image_url) {
          const validSetsNow = deduped;
          if (validSetsNow.length > 0) {
            ogAttemptedRef.current = true;
            const uniqueExercises = new Set(validSetsNow.map(s => s.exercise_id).filter(Boolean));
            const exerciseCount = uniqueExercises.size;
            const setCount = validSetsNow.length;
            const durationSeconds = workoutData.duration_seconds || 0;
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const duration = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : '';
            const date = new Date(workoutData.completed_at || workoutData.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            // Build owner possessive + workout name for the main title
            let ownerFullName = '';
            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', workoutData.user_id)
                .maybeSingle();
              if (prof) {
                const first = prof.first_name || '';
                const last = prof.last_name || '';
                ownerFullName = `${first} ${last}`.trim();
              }
            } catch (_) {}
            const ownerFirst = (ownerFullName.trim().split(' ')[0] || '').trim();
            const possessive = ownerFirst ? ownerFirst + (ownerFirst.toLowerCase().endsWith('s') ? "'" : "'s") + ' ' : '';
            const displayWorkoutName = `${possessive}${workoutData?.workout_name || 'Completed Workout'}`;

            const data = {
              routineName: workoutData?.routines?.routine_name || 'Workout',
              workoutName: displayWorkoutName,
              date,
              duration,
              exerciseCount,
              setCount
            };
            try {
              await generateAndUploadOGImage(workoutId, data);
              // Refresh workout row to capture og_image_url
              const { data: refreshed } = await supabase
                .from('workouts')
                .select('og_image_url')
                .eq('id', workoutId)
                .maybeSingle();
              if (refreshed?.og_image_url) {
                setWorkout(prev => prev ? { ...prev, og_image_url: refreshed.og_image_url } : prev);
                toast.success('Social image generated');
              }
            } catch (e) {
              console.warn('[CompletedWorkout] Fallback OG generation failed:', e);
            }
          }
        }
      } catch (e) {
        console.warn('[CompletedWorkout] Fallback OG generation guard error:', e);
      }
    };
    if (workoutId) fetchData();
  }, [workoutId, user, currentUser]);

  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.workout_name);
      setPublicLink(Boolean(workout.is_public));
    }
  }, [workout]);

  // Background processor: drain any queued OG generations (e.g., if Finish ran while tab navigated)
  useEffect(() => {
    (async () => {
      try {
        const key = 'og_generation_queue';
        const raw = localStorage.getItem(key);
        if (!raw) return;
        let queue = [];
        try { queue = JSON.parse(raw) || []; } catch (_) { queue = []; }
        if (!Array.isArray(queue) || queue.length === 0) return;

        // Process one by one to reduce load
        const remaining = [];
        for (const id of queue) {
          try {
            // Fetch data needed for generation
            const { data: w } = await supabase
              .from('workouts')
              .select(`*, routines!workouts_routine_id_fkey(routine_name)`) 
              .eq('id', id)
              .maybeSingle();
            if (!w) { continue; }
            // Build minimal metrics via completed sets
            const { data: sets } = await supabase
              .from('sets')
              .select('id, exercise_id, status, set_type, reps, timed_set_duration')
              .eq('workout_id', id);
            const valid = (sets || []).filter(s => s?.status === 'complete' && (s?.set_type === 'timed' ? (s?.timed_set_duration||0) > 0 : (s?.reps||0) > 0));
            const ex = new Set(valid.map(s => s.exercise_id).filter(Boolean));
            const durationSeconds = w?.duration_seconds || 0;
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const duration = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : '';
            const date = new Date(w?.completed_at || w?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const data = {
              routineName: w?.routines?.routine_name || 'Workout',
              workoutName: w?.workout_name || 'Completed Workout',
              date,
              duration,
              exerciseCount: ex.size || (w?.workout_exercises?.length || 0),
              setCount: valid.length
            };
            await generateAndUploadOGImage(id, data);
          } catch (e) {
            console.warn('[OGQueue] generation failed for', id, e);
            remaining.push(id);
          }
        }
        if (remaining.length === 0) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(remaining));
        }
      } catch (e) {
        console.warn('[OGQueue] processor error', e);
      }
    })();
  }, []);

  // Fetch owner name when not owner or when delegated
  useEffect(() => {
    if (!workout) return;
    // Fetch owner name if not owner OR if delegated (to show client name)
    if (isOwner && !isDelegated) return;
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
  }, [workout, isOwner, isDelegated]);

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
        .eq("user_id", currentUser.id);

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
    console.log('[CompletedWorkout] Starting delete process:', {
      workoutId,
      currentUserId: currentUser?.id,
      workoutUserId: workout?.user_id,
      isDelegated
    });

    try {
      // Manually delete associated sets first
      console.log('[CompletedWorkout] Deleting sets for workout:', workoutId);
      const { error: setsError, count: deletedSetsCount } = await supabase
        .from("sets")
        .delete({ count: 'exact' })
        .eq("workout_id", workoutId);

      console.log('[CompletedWorkout] Sets deletion result:', { 
        error: setsError, 
        deletedSetsCount 
      });

      if (setsError) {
        throw new Error(
          "Failed to delete associated sets: " + setsError.message
        );
      }

      // Then, delete the workout
      // Use the workout's actual user_id rather than filtering by currentUser
      const targetUserId = workout.user_id;
      console.log('[CompletedWorkout] Deleting workout:', { 
        workoutId, 
        currentUserId: currentUser.id,
        targetUserId,
        workoutUserId: workout.user_id,
        isDelegated
      });
      const { error: workoutError, count: deletedWorkoutCount } = await supabase
        .from("workouts")
        .delete({ count: 'exact' })
        .eq("id", workoutId)
        .eq("user_id", targetUserId);

      console.log('[CompletedWorkout] Workout deletion result:', { 
        error: workoutError, 
        deletedWorkoutCount 
      });

      if (workoutError) {
        throw new Error("Failed to delete workout: " + workoutError.message);
      }

      if (deletedWorkoutCount === 0) {
        throw new Error("Workout not found or permission denied");
      }

      // Navigate back to history
      navigate('/history');
    } catch (err) {
      console.error('[CompletedWorkout] Delete failed:', err);
      toast.error(err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };



  const ensurePublic = async () => {
    if (!workout.is_public) {
      const { error } = await supabase
        .from('workouts')
        .update({ is_public: true })
        .eq('id', workoutId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setWorkout((prev) => ({ ...prev, is_public: true }));
    }
  };

  const handleShare = () => {
    shareWorkout();
  };

  const handleTogglePublic = async (val) => {
    // Optimistic update: update local state immediately
    setPublicLink(val);
    try {
      await supabase
        .from('workouts')
        .update({ is_public: val })
        .eq('id', workoutId)
        .eq('user_id', currentUser.id);
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

  const handleOpenRoutine = () => {
    if (!workout?.routine_id) return;
    const target = (isOwner && !isPublicWorkoutView)
      ? `/routines/${workout.routine_id}/configure`
      : `/routines/public/${workout.routine_id}`;
    navigate(target);
  };

  // Unified share handler: share link only (no image). Mobile uses Web Share API;
  // desktop falls back to copying the URL.
  const shareWorkout = async () => {
    setSharing(true);
    try {
      // Only ensure public if user is logged in and owns the workout
      if (!isPublicWorkoutView && isOwner) {
        await ensurePublic();
      }

      const url = `${window.location.origin}/history/public/workout/${workoutId}`;
      const title = workout?.workout_name || 'Completed Workout';
      const text = title;

      // Prefer native share whenever available; do not fall back to copy
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (shareErr) {
          // Swallow user cancellations or share errors; no clipboard fallback when share is supported
          // Common names: AbortError, NotAllowedError, TypeError
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



  return (
    <>
      <AppLayout
        hideHeader={false}
        title="Workout summary"
        titleRightText={isPublicWorkoutView && ownerName ? `Shared by ${ownerName}` : undefined}
        variant="glass"
        showBackButton={!isPublicWorkoutView || ownerHistoryPublic || (isDelegated && workout)}
        onBack={() => {
          if (isPublicWorkoutView && workout) {
            navigate(`/history/public/${workout.user_id}`);
          } else if (isDelegated && workout) {
            // For delegates, navigate to the owner's history page
            navigate(`/history`, { 
              state: { 
                managingForOwner: true, 
                ownerId: workout.user_id,
                ownerName: ownerName
              } 
            });
          } else {
            navigate('/history');
          }
        }}
        showShare={true}
        onShare={shareWorkout}
        showUpload={false}
        onUpload={() => {
          // TODO: Implement upload functionality
          console.log('Upload clicked');
        }}
        showDelete={isOwner || isDelegated}
        onDelete={handleDeleteWorkout}
        showSettings={false}
        onSettings={() => setEditWorkoutOpen(true)}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
        showDeleteOption={isOwner || isDelegated}
        showSidebar={!isPublicWorkoutView && !isDelegated}
      >
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : workout ? (
          <div className="w-full px-5 pb-10 flex flex-col justify-start items-start" style={{ paddingTop: '72px' }}>
            {/* Image and Routine Label Section */}
            <div className="self-stretch flex flex-col justify-center items-center gap-3">
              {/* Image Container */}
              <div className="w-full max-w-[500px] rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-center items-center overflow-hidden">
                <img 
                  className="w-full h-auto max-h-64" 
                  src={workout?.og_image_url || `/api/og-image?workoutId=${workoutId}`}
                  alt="Workout social preview"
                  draggable={false}
                  onClick={shareWorkout}
                  title="Share"
                />
              </div>
              
              {/* Routine Label Container */}
              {workout?.routine_id && (
                <div 
                  className="w-full h-14 max-w-[500px] pl-2 pr-5 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center cursor-pointer"
                  onClick={handleOpenRoutine}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenRoutine(); } }}
                  aria-label="Open routine"
                >
                  <div className="p-2.5 flex justify-start items-center gap-2.5">
                    <div className="relative">
                      <Star className="w-6 h-6 text-neutral-600" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-5">
                    <div className="justify-center text-neutral-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                      {workout?.routines?.routine_name ? `${workout.routines.routine_name} routine` : 'View routine'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exercise List */}
            <div className="self-stretch flex flex-col justify-start items-center overflow-hidden">
              {exercisesBySection.length > 0 ? (
                exercisesBySection.map(({ section, exercises: sectionExercises }) => (
                  <PageSectionWrapper
                    key={section}
                    section={section}
                    deckGap={12}
                    backgroundClass="bg-transparent"
                    showPlusButton={false}
                    style={{ paddingBottom: 0, paddingTop: 40, maxWidth: '500px', minWidth: '0px' }}
                  >
                    {sectionExercises.map((exercise) => (
                      <WorkoutSummaryCard
                        key={exercise.id}
                        exerciseName={exercise.exercise}
                        sets={exercise.setLog}
                      />
                    ))}
                  </PageSectionWrapper>
                ))
              ) : (
                <div className="text-center py-10">
                  <p>No sets were logged for this workout.</p>
                </div>
              )}
            </div>
          </div>
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
        <SwiperDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
          title="Delete workout?"
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
          cancelVariant="outline"
        />
        <SwiperForm
          open={isEditWorkoutOpen}
          onOpenChange={setEditWorkoutOpen}
          title="Edit"
          description="Edit workout name and manage workout settings"
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

      </AppLayout>
    </>
  );
};

export default CompletedWorkout;
