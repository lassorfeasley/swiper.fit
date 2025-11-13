import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { AlertCircle } from "lucide-react";
import {
  SwiperCard,
  SwiperCardContent,
} from "@/components/shared/SwiperCard";
import AppLayout from "@/components/layout/AppLayout";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { ActionCard } from "@/components/shared/ActionCard";
import { Eye } from "lucide-react";
import LoggedOutNav from "../components/LoggedOutNav";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { postSlackEvent } from "@/lib/slackEvents";
import { postEmailEvent } from "@/lib/emailEvents";
import { linkPendingInvitations } from "@/lib/sharingApi";
import { toast } from "@/lib/toastReplacement";

export default function CreateAccount(): React.JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { isWorkoutActive, loading: workoutLoading } = useActiveWorkout();
  const importRoutineId = new URLSearchParams(location.search).get('importRoutineId');

  // Handle email pre-population from invitation links
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  const cloneRoutineForCurrentUser = async (sourceRoutineId) => {
    console.log('[CreateAccount] Attempting RPC clone_routine for routine:', sourceRoutineId);
    try {
      // Lookup owner name for attribution used in RPC new_name
      let ownerName;
      try {
        const { data: srcOwner } = await supabase
          .from('routines')
          .select('user_id')
          .eq('id', sourceRoutineId)
          .maybeSingle();
        if (srcOwner?.user_id) {
          const { data: owner } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', srcOwner.user_id)
            .maybeSingle();
          if (owner) {
            ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
          }
        }
      } catch (_) {}

      const { data: newId, error: rpcError } = await supabase.rpc('clone_routine', {
        source_routine_id: sourceRoutineId,
        new_name: null, // Will use original routine name
      });
      if (!rpcError && newId) {
        console.log('[CreateAccount] RPC clone_routine succeeded, new routine ID:', newId);
        return newId;
      }
    } catch (e) {
      console.log('[CreateAccount] RPC clone_routine failed, falling back to manual clone:', e);
    }

    // Fallback manual clone
    console.log('[CreateAccount] Starting manual clone with attribution:');
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) throw new Error('Not authenticated');

    const { data: src, error: srcErr } = await supabase
      .from('routines')
      .select(`
        id,
        routine_name,
        user_id,
        created_by,
        shared_by,
        routine_exercises!fk_routine_exercises__routines(
          id,
          exercise_order,
          exercises!fk_routine_exercises__exercises(id),
          routine_sets!fk_routine_sets__routine_exercises(
            id, reps, weight, weight_unit, set_order, set_variant, set_type, timed_set_duration
          )
        )
      `)
      .eq('id', sourceRoutineId)
      .eq('is_public', true)
      .single();
    if (srcErr || !src) throw new Error('Shared routine not available');

    console.log('  Source routine created_by:', src.created_by);
    console.log('  Source routine shared_by:', src.shared_by);
    console.log('  Source routine user_id:', src.user_id);
    console.log('  New routine will have created_by:', src.created_by || src.user_id);
    console.log('  New routine will have shared_by:', src.user_id);

    const { data: newRoutine, error: newErr } = await supabase
      .from('routines')
      .insert({ 
        routine_name: src.routine_name, 
        user_id: uid, 
        is_archived: false, 
        is_public: false,
        created_by: src.created_by || src.user_id,
        shared_by: src.user_id
      })
      .select('id')
      .single();
    if (newErr || !newRoutine) throw newErr || new Error('Failed to create routine');
    
    console.log('[CreateAccount] Successfully created cloned routine:', newRoutine.id);
    console.log('  New routine created_by:', src.created_by || src.user_id);
    console.log('  New routine shared_by:', src.user_id);
    
    const newRoutineId = newRoutine.id;

    const exercisesPayload = (src.routine_exercises || [])
      .sort((a: any, b: any) => (a.exercise_order||0) - (b.exercise_order||0))
      .map((re: any) => ({ routine_id: newRoutineId, exercise_id: re.exercises.id, exercise_order: re.exercise_order || 0, user_id: uid }));
    let inserted = [];
    if (exercisesPayload.length > 0) {
      const { data: reRows, error: reErr } = await supabase
        .from('routine_exercises')
        .insert(exercisesPayload)
        .select('id, exercise_id');
      if (reErr) throw reErr;
      inserted = reRows || [];
    }
    for (const re of src.routine_exercises || []) {
      const target = inserted.find((x: any) => x.exercise_id === (re as any).exercises.id);
      if (!target) continue;
      const setsPayload = (re.routine_sets || []).sort((a,b)=> (a.set_order||0)-(b.set_order||0)).map((rs) => ({
        routine_exercise_id: target.id,
        set_order: rs.set_order,
        reps: rs.reps,
        weight: rs.weight,
        weight_unit: rs.weight_unit,
        set_type: rs.set_type,
        timed_set_duration: rs.timed_set_duration,
        set_variant: rs.set_variant,
        user_id: uid,
      }));
      if (setsPayload.length > 0) {
        const { error: rsErr } = await supabase.from('routine_sets').insert(setsPayload);
        if (rsErr) throw rsErr;
      }
    }

    return newRoutineId;
  };

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: { email: string; password: string; firstName: string; lastName: string }) => {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      if (error) throw error;
      
      // Create profile record with first and last name
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
          });
        if (profileError) throw profileError;
      }
      
      return data;
    },
    onSuccess: async () => {
      setErrorMessage("");
      const msg =
        import.meta.env.VITE_SUPABASE_REQUIRE_CONFIRM === "false"
          ? "Account created! Welcome aboard."
          : "Account created! Check your email to confirm your address.";
      setSuccessMessage(msg);
      toast.success(msg);

      // Ensure the session is fully populated by signing in explicitly.
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch (e) {
        console.error("Post-signup login failed", e);
      }

      // Slack: account created
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (uid) {
          postSlackEvent('account.created', {
            account_id: uid,
            user_id: uid,
            email,
          });
          // Send Account Created email
          postEmailEvent('account.created', email, {
            user_id: uid,
            email,
          });

          // Link any pending invitations for this email
          try {
            const linkedCount = await linkPendingInvitations(uid, email);
            if (linkedCount > 0) {
              toast.success(`You have ${linkedCount} pending invitation${linkedCount > 1 ? 's' : ''}! Check the Trainers page to accept them.`);
            }
          } catch (inviteError) {
            console.error('Failed to link pending invitations:', inviteError);
            // Don't throw - account creation was successful
          }
        }
      } catch (_) {}

      // If coming from a public routine, import it now and jump into builder
      try {
        if (importRoutineId) {
          const newId = await cloneRoutineForCurrentUser(importRoutineId);
          navigate(`/routines/${newId}/configure`, { replace: true, state: { fromPublicImport: true } });
          return;
        }
      } catch (e) {
        // Fall through to normal redirect on failure
        console.warn('Routine import after signup failed:', e);
      }

      // Otherwise, redirect based on workout state
      const checkWorkoutAndRedirect = () => {
        if (!workoutLoading) {
          if (isWorkoutActive) {
            navigate("/workout/active");
          } else {
            navigate("/train");
          }
        } else {
          setTimeout(checkWorkoutAndRedirect, 100);
        }
      };
      checkWorkoutAndRedirect();
    },
    onError: (error: any) => {
      setErrorMessage(error.message);
      setSuccessMessage("");
      toast.error(error.message);
      console.error("Signup error:", error);
    },
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ email, password, firstName, lastName });
  };

  // Show loading state while workout context is loading after signup
  if (signupMutation.isSuccess && workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-stone-100 pt-20">

      {/* Main Content */}
      <div className="self-stretch flex flex-col justify-center items-center flex-1">
        <DeckWrapper gap={0} className="flex-1">
          <CardWrapper>
            <div className="self-stretch p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleSignup} className="w-full flex flex-col gap-5">
                {/* Header row */}
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Create an account
                  </div>
                  <div 
                    className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                    onClick={() => navigate(importRoutineId ? `/login?importRoutineId=${importRoutineId}` : "/login")}
                  >
                    Log in
                  </div>
                </div>

                {/* First Name field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-600 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        First name
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="text"
                    id="create-account-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={signupMutation.isPending}
                    error={!!errorMessage}
                    required
                  />
                </div>

                {/* Last Name field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-600 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Last name
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="text"
                    id="create-account-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={signupMutation.isPending}
                    error={!!errorMessage}
                    required
                  />
                </div>

                {/* Email field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-600 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Email
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="email"
                    id="create-account-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={signupMutation.isPending || (new URLSearchParams(location.search).get("email") !== null)}
                    error={!!errorMessage}
                  />
                </div>

                {/* Password field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-600 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Password
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="password"
                    id="create-account-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={signupMutation.isPending}
                    error={!!errorMessage}
                  />
                </div>

                {/* Success messages only */}
                {successMessage && (
                  <div className="text-green-500 text-sm font-['Be_Vietnam_Pro']">
                    {successMessage}
                  </div>
                )}

                {/* Create Account Button */}
                <Button
                  variant="affirmative"
                  disabled={signupMutation.isPending || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()}
                  onClick={signupMutation.isPending || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() ? undefined : handleSignup}
                  className="self-stretch"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </div>
          </CardWrapper>
        </DeckWrapper>
      </div>

      {/* Footer */}
      <div className="self-stretch h-36 px-3 pt-3 pb-24 bg-white border-t border-neutral-300 flex flex-col justify-start items-start gap-3">
        <div className="self-stretch min-w-36 justify-start text-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">
          Developed by Lassor
        </div>
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <div className="self-stretch justify-start text-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
            www.Lassor.com
          </div>
          <div className="w-56 justify-start text-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
            Feasley@Lassor.com
          </div>
        </div>
      </div>
    </div>
  );
}
