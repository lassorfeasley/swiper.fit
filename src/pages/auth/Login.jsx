import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { AlertCircle } from "lucide-react";
import {
  SwiperCard,
  SwiperCardContent,
} from "@/components/molecules/swiper-card";
import AppLayout from "@/components/layout/AppLayout";
import { TextInput } from "@/components/molecules/text-input";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import LoggedOutNav from "@/components/layout/LoggedOutNav";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const importRoutineId = new URLSearchParams(location.search).get('importRoutineId');
  const { isWorkoutActive, loading: workoutLoading } = useActiveWorkout();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      setEmailError(false);
      setPasswordError(false);
      setErrorMessage("");
      toast.success("Logged in successfully");
      try {
        if (importRoutineId) {
          // After login, navigate to public routine page to trigger clone flow in builder route
          navigate(`/routines/${importRoutineId}/configure`, { replace: true, state: { fromPublicImport: true } });
          return;
        }
      } catch (_) {}

      // Wait for workout context to load, then redirect appropriately
      const checkWorkoutAndRedirect = () => {
        if (!workoutLoading) {
          if (isWorkoutActive) {
            navigate("/workout/active");
          } else {
            navigate("/train");
          }
        } else {
          // If still loading, check again in a moment
          setTimeout(checkWorkoutAndRedirect, 100);
        }
      };

      checkWorkoutAndRedirect();
    },
    onError: (error) => {
      const msg = error.message.toLowerCase();
      setEmailError(
        msg.includes("email") ||
          (!msg.includes("email") && !msg.includes("password"))
      );
      setPasswordError(
        msg.includes("password") ||
          (!msg.includes("email") && !msg.includes("password"))
      );
      setErrorMessage(error.message);
      console.error("Login error:", error);
      toast.error(error.message);
    },
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  // Show loading state while workout context is loading after login
  if (loginMutation.isSuccess && workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking for active workouts...</p>
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
            <div className="self-stretch p-5 bg-white rounded-[12px] border border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
                {/* Header row */}
                <div className="self-stretch inline-flex justify-between items-center">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Login to your account
                  </div>
                  <div 
                    className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                    onClick={() => navigate(importRoutineId ? `/create-account?importRoutineId=${importRoutineId}` : "/create-account")}
                  >
                    Sign up
                  </div>
                </div>

                {/* Email field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Email
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="email"
                    id="login-email"
                    name="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDownCapture={(e) => { /* ensure no parent prevents typing */ }}
                    readOnly={false}
                    disabled={loginMutation.isPending}
                    error={emailError}
                  />
                  {emailError && (
                    <div className="text-red-500 text-sm font-['Be_Vietnam_Pro']">
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Password field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Password
                      </div>
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                      <div 
                        className="flex-1 text-right justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight cursor-pointer"
                        onClick={() => navigate("/reset-password")}
                      >
                        Forgot?
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="password"
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDownCapture={(e) => { /* ensure no parent prevents typing */ }}
                    readOnly={false}
                    disabled={loginMutation.isPending}
                    error={passwordError}
                  />
                  {passwordError && (
                    <div className="text-red-500 text-sm font-['Be_Vietnam_Pro']">
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Login button */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="self-stretch h-12 min-w-44 px-4 py-2 bg-neutral-neutral-600 rounded-xl text-white"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
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
          <div className="self-stretch justify-start text-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
            Feasley@Lassor.com
          </div>
        </div>
      </div>
    </div>
  );
}
