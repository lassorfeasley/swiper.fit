import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { TextInput } from "@/components/shared/inputs/TextInput";
import LoggedOutNav from "../components/LoggedOutNav";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import { toast } from "@/lib/toastReplacement";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const location = useLocation();

  // Check for expired link error on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'expired') {
      setStatus({
        type: "error",
        message: "This password reset link has expired or is invalid. Please request a new one.",
      });
      // Clean up the URL
      navigate('/reset-password', { replace: true });
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // Get the current origin (e.g., http://localhost:3000)
    const origin = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/update-password`,
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      toast.success("Check your email for a password reset link.");
    }
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-stone-100 pt-20">

      {/* Main Content */}
      <div className="self-stretch flex flex-col justify-center items-center flex-1">
        <DeckWrapper gap={0} className="flex-1">
          <CardWrapper>
            <div className="self-stretch p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                {/* Header */}
                <div className="self-stretch flex flex-col gap-2">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Forgot your password?
                  </div>
                </div>

                {/* Status messages */}
                {status.type === "error" && (
                  <div className="self-stretch p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="text-red-800 text-sm font-['Be_Vietnam_Pro']">
                      {status.message}
                    </div>
                  </div>
                )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to reset password"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="self-stretch flex flex-col gap-2">
                  <Button
                    type="submit"
                    variant="destructive"
                  >
                    Send reset link
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/login")}
                  >
                    Back to login
                  </Button>
                </div>
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
