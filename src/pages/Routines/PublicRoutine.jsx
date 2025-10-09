import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppLayout from "@/components/layout/AppLayout";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import ExerciseCard from "@/components/common/Cards/ExerciseCard";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark } from "lucide-react";

export default function PublicRoutine() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { startWorkout } = useActiveWorkout();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState(null);

  useEffect(() => {
    async function fetchRoutine() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("routines")
          .select(`
            id,
            routine_name,
            is_public,
            user_id,
            og_image_url,
            routine_exercises!fk_routine_exercises__routines(
              id,
              exercise_order,
              exercises!fk_routine_exercises__exercises(id, name, section),
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
            )
          `)
          .eq("id", routineId)
          .eq("is_public", true)
          .single();
        if (error || !data) {
          navigate("/login", { replace: true });
          return;
        }
        // Fetch owner profile
        let ownerName;
        if (data.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', data.user_id)
            .maybeSingle();
          if (profile) {
            ownerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          }
        }
        console.log('Routine data:', data);
        console.log('OG Image URL:', data.og_image_url);
        setRoutine({ ...data, owner_name: ownerName });
      } finally {
        setLoading(false);
      }
    }
    fetchRoutine();
  }, [routineId, navigate]);

  // If the logged-in user is the owner of the routine, redirect to the builder
  useEffect(() => {
    if (user && routine && routine.user_id && user.id === routine.user_id) {
      navigate(`/routines/${routine.id}/configure`, { replace: true });
    }
  }, [user?.id, routine?.user_id, routine?.id, navigate]);

  const cloneRoutineForCurrentUser = async () => {
    // Try RPC first (if function exists)
    try {
      const { data: newId, error: rpcError } = await supabase.rpc('clone_routine', {
        source_routine_id: routine.id,
        new_name: `${routine.routine_name} | Shared by ${routine.owner_name || 'User'}`,
      });
      if (!rpcError && newId) return newId;
    } catch (_) {}

    // Fallback manual clone
    // 1) Create routine copy
    const { data: newRoutine, error: routineErr } = await supabase
      .from('routines')
      .insert({
        routine_name: `${routine.routine_name} | Shared by ${routine.owner_name || 'User'}`,
        user_id: user.id,
        is_archived: false,
        is_public: false,
      })
      .select('id')
      .single();
    if (routineErr || !newRoutine) throw routineErr || new Error('Failed to create routine');

    const newRoutineId = newRoutine.id;

    // 2) Insert routine_exercises
    const exercisesPayload = (routine.routine_exercises || [])
      .sort((a,b) => (a.exercise_order||0) - (b.exercise_order||0))
      .map((re) => ({
        routine_id: newRoutineId,
        exercise_id: re.exercises.id,
        exercise_order: re.exercise_order || 0,
        user_id: user.id,
      }));
    let insertedREs = [];
    if (exercisesPayload.length > 0) {
      const { data: reRows, error: reErr } = await supabase
        .from('routine_exercises')
        .insert(exercisesPayload)
        .select('id, exercise_id');
      if (reErr) throw reErr;
      insertedREs = reRows || [];
    }

    // 3) Insert routine_sets
    for (const re of routine.routine_exercises || []) {
      const newRE = insertedREs.find((row) => row.exercise_id === re.exercises.id);
      if (!newRE) continue;
      const setsPayload = (re.routine_sets || [])
        .sort((a,b) => (a.set_order||0) - (b.set_order||0))
        .map((rs) => ({
          routine_exercise_id: newRE.id,
          set_order: rs.set_order,
          reps: rs.reps,
          weight: rs.weight,
          weight_unit: rs.weight_unit,
          set_type: rs.set_type,
          timed_set_duration: rs.timed_set_duration,
          set_variant: rs.set_variant,
          user_id: user.id,
        }));
      if (setsPayload.length > 0) {
        const { error: rsErr } = await supabase
          .from('routine_sets')
          .insert(setsPayload);
        if (rsErr) throw rsErr;
      }
    }

    return newRoutineId;
  };

  const handleStart = async () => {
    if (!routine) return;
    // Logged out: send to create-account with import param
    if (!user) {
      navigate(`/create-account?importRoutineId=${routineId}`);
      return;
    }
    // Logged in and not owner: clone routine into user's account and open builder
    try {
      const newId = await cloneRoutineForCurrentUser();
      toast.success('Routine saved to your account');
      navigate(`/routines/${newId}/configure`, { state: { fromPublicImport: true } });
    } catch (e) {
      toast.error(e?.message || 'Failed to save routine');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: routine?.routine_name || "Routine",
        text: `Check out this routine shared by ${routine?.owner_name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <AppLayout
      hideHeader={false}
      showSidebar={false}
      title={routine?.routine_name || "Routine"}
      titleRightText={routine?.owner_name ? `Shared by ${routine.owner_name}` : undefined}
      variant="glass"
      showShare={true}
      onShare={handleShare}
    >
      <div className="flex flex-col min-h-screen" style={{ paddingTop: 'calc(var(--header-height) + 20px)' }}>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : !routine ? (
          <div className="text-gray-400 text-center py-8">Routine not available.</div>
        ) : (
          <>
            {/* Routine Image Section */}
            <div className="self-stretch inline-flex flex-col justify-start items-center">
              <div className="self-stretch px-5 inline-flex justify-center items-center gap-5">
                <div 
                  className="w-full max-w-[500px] rounded-[20px] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 overflow-hidden cursor-pointer"
                  onClick={handleShare}
                >
                  <img 
                    className="w-full h-auto block" 
                    src={routine?.og_image_url || `/api/generate-routine-og-image?routineId=${routineId}`} 
                    alt={`${routine.routine_name} routine`}
                    draggable={false}
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      console.log('Falling back to default image');
                      e.target.src = "/images/default-open-graph.png";
                    }}
                    onLoad={() => console.log('Image loaded successfully:', e.target.src)}
                  />
                </div>
              </div>
            </div>
            
            <PageSectionWrapper
              section="workout"
              id={`section-workout`}
              deckGap={12}
              deckVariant="cards"
              reorderable={false}
              items={(routine.routine_exercises || [])}
              className="flex-1"
              applyPaddingOnParent={true}
              style={{ paddingLeft: 28, paddingRight: 28, paddingBottom: 0, maxWidth: '500px', minWidth: '0px' }}
            >
            {(routine.routine_exercises || [])
              .sort((a,b) => (a.exercise_order||0) - (b.exercise_order||0))
              .map((re) => (
                <ExerciseCard
                  key={re.id}
                  exerciseName={re.exercises?.name}
                  setConfigs={(re.routine_sets || [])
                    .sort((a,b) => (a.set_order||0) - (b.set_order||0))
                    .map((rs) => ({
                      reps: rs.reps,
                      weight: rs.weight,
                      unit: rs.weight_unit || 'lbs',
                      set_variant: rs.set_variant || `Set ${rs.set_order}`,
                      set_type: rs.set_type,
                      timed_set_duration: rs.timed_set_duration,
                    }))}
                  hideGrip
                  addTopBorder
                />
              ))}
            </PageSectionWrapper>
          </>
        )}
      </div>
      
      {/* Persistent Save Button - Absolutely positioned at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center items-center px-5 pb-5 bg-[linear-gradient(to_bottom,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)]" style={{ paddingBottom: '20px' }}>
        <div 
          className="w-full max-w-[500px] h-14 pl-2 pr-5 bg-green-600 rounded-[50px] shadow-[0px_0px_8px_0px_rgba(212,212,212,1.00)] backdrop-blur-[1px] inline-flex justify-start items-center cursor-pointer"
          onClick={handleStart}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStart?.(); } }}
          aria-label={user ? "Save routine to my account" : "Create account to save routine"}
        >
          <div className="p-2.5 flex justify-start items-center gap-2.5">
            <div className="relative">
              <Bookmark className="w-6 h-6" stroke="white" strokeWidth="2" />
            </div>
          </div>
          <div className="flex justify-center items-center gap-5">
            <div className="justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
              {user ? "Save routine to my account" : "Login or create account to save"}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


