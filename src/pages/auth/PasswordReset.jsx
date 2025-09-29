import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Alert, AlertDescription } from "@/components/atoms/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { TextInput } from "@/components/molecules/text-input";
import LoggedOutNav from "@/components/layout/LoggedOutNav";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();

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
      setStatus({
        type: "success",
        message: "Check your email for a password reset link.",
      });
    }
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-stone-100 pt-20">

      {/* Main Content */}
      <div className="self-stretch flex flex-col justify-center items-center flex-1 px-5">
        <DeckWrapper gap={0} className="flex-1">
          <CardWrapper>
            <div className="self-stretch p-5 bg-white rounded-[12px] border border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                {/* Header */}
                <div className="self-stretch flex flex-col gap-2">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Forgot your password?
                  </div>
                  <div className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">
                    Enter your email and we'll send you a link to reset your password.
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
                {status.type === "success" && (
                  <div className="self-stretch p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div className="text-green-800 text-sm font-['Be_Vietnam_Pro']">
                      {status.message}
                    </div>
                  </div>
                )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="self-stretch h-12 px-4 py-2 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 inline-flex justify-center items-center gap-2.5 transition-colors"
                >
                  <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Send reset link
                  </div>
                </button>

                {/* Back to login link */}
                <div 
                  className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight cursor-pointer text-center"
                  onClick={() => navigate("/login")}
                >
                  Back to login
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
