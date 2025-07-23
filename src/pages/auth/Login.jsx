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
import { Eye } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setEmailError(false);
      setPasswordError(false);
      setErrorMessage("");
      toast.success("Logged in successfully");
      navigate("/routines");
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

  return (
    <AppLayout showSidebar={false} hideHeader>
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <SwiperCard className="w-full max-w-md mx-4">
          <SwiperCardContent className="p-5">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Header row */}
              <div className="self-stretch inline-flex justify-between items-center">
                <div className="text-slate-600 text-xl font-medium leading-9">
                  Login to your account
                </div>
                <div
                  className="text-slate-600 text-sm font-normal leading-tight cursor-pointer"
                  onClick={() => navigate("/create-account")}
                >
                  Sign up
                </div>
              </div>
              {/* Email field label */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
                <div className="self-stretch inline-flex justify-between items-start">
                  <div className="flex-1 text-slate-600 text-sm font-bold leading-tight">
                    Email
                  </div>
                </div>
                <div className="mb-4 w-full">
                  <TextInput
                    type="email"
                    id="login-email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    error={emailError ? errorMessage : undefined}
                  />
                </div>
              </div>
              {/* Password field label and forgot link */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
                <div className="self-stretch inline-flex justify-between items-start">
                  <div className="text-slate-600 text-sm font-bold leading-tight">
                    Password
                  </div>
                  <div
                    className="text-slate-600 text-sm font-normal leading-tight cursor-pointer"
                    onClick={() => navigate("/reset-password")}
                  >
                    Forgot your password?
                  </div>
                </div>
                <div className="mb-4 w-full">
                  <TextInput
                    type="password"
                    id="login-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    icon={<Eye className="size-6 text-neutral-300" />}
                    error={passwordError ? errorMessage : undefined}
                  />
                </div>
              </div>
              {/* Login button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-[56px]"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </SwiperCardContent>
        </SwiperCard>
      </div>
    </AppLayout>
  );
}
