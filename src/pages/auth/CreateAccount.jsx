import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/button";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/atoms/alert";
import { AlertCircle } from "lucide-react";
import {
  SwiperCard,
  SwiperCardContent,
} from "@/components/molecules/swiper-card";
import AppLayout from "@/components/layout/AppLayout";
import { TextInput } from "@/components/molecules/text-input";
import { ActionCard } from "@/components/molecules/action-card";
import { Eye } from "lucide-react";
import LoggedOutNav from "@/components/layout/LoggedOutNav";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";

export default function CreateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { isWorkoutActive, loading: workoutLoading } = useActiveWorkout();

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      setErrorMessage("");
      const msg =
        import.meta.env.VITE_SUPABASE_REQUIRE_CONFIRM === "false"
          ? "Account created! Welcome aboard."
          : "Account created! Check your email to confirm your address.";
      setSuccessMessage(msg);

      // Ensure the session is fully populated by signing in explicitly.
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch (e) {
        console.error("Post-signup login failed", e);
      }

      // Wait for workout context to load, then redirect appropriately
      const checkWorkoutAndRedirect = () => {
        if (!workoutLoading) {
          if (isWorkoutActive) {
            navigate("/workout/active");
          } else {
            navigate("/routines");
          }
        } else {
          // If still loading, check again in a moment
          setTimeout(checkWorkoutAndRedirect, 100);
        }
      };
      
      checkWorkoutAndRedirect();
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setSuccessMessage("");
      console.error("Signup error:", error);
    },
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    signupMutation.mutate({ email, password });
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
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-white">
      {/* Navigation */}
      <LoggedOutNav showAuthButtons={false} />

      {/* Main Content */}
      <div className="self-stretch flex flex-col justify-center items-center flex-1 px-5">
        <DeckWrapper gap={0} className="flex-1">
          <CardWrapper>
            <div className="self-stretch p-5 bg-white border-b border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleSignup} className="w-full flex flex-col gap-5">
                {/* Header row */}
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Create an account
                  </div>
                  <div 
                    className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                    onClick={() => navigate("/login")}
                  >
                    Log in
                  </div>
                </div>

                {/* Email field */}
                <div className="self-stretch min-w-64 rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Email
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="email"
                    id="create-account-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={signupMutation.isPending}
                    error={!!errorMessage}
                  />
                </div>

                {/* Password field */}
                <div className="self-stretch min-w-64 rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
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
              </form>
            </div>
          </CardWrapper>

          {/* Create Account Action Card */}
          <ActionCard
            text={signupMutation.isPending ? "Creating Account..." : "Create Account"}
            onClick={handleSignup}
            disabled={signupMutation.isPending}
          />
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
