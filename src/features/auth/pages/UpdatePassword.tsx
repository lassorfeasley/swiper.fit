import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Alert } from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { AlertDescription } from "@/components/shadcn/alert";
import { AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { TextInput } from "@/components/shared/inputs/TextInput";
import {
  SwiperCard,
  SwiperCardContent,
} from "@/components/shared/SwiperCard";
import LoggedOutNav from "../components/LoggedOutNav";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  // Clean up any remaining hash fragments on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      // Clean up the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setStatus({
        type: "error",
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Password updated successfully" });
      // Clear the form
      setNewPassword("");
      setConfirmPassword("");
      // Navigate to train page after a short delay
      setTimeout(() => navigate("/train"), 2000);
    }
  };

  return (
    <div className="w-full inline-flex flex-col justify-start items-start min-h-screen bg-stone-100 pt-20">

      {/* Main Content */}
      <div className="self-stretch flex flex-col justify-center items-center flex-1">
        <DeckWrapper gap={0} className="flex-1">
          <CardWrapper>
            <div className="self-stretch p-5 bg-white border-b border-neutral-300 flex flex-col justify-start items-start gap-5">
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                {/* Header */}
                <div className="self-stretch flex flex-col gap-2">
                  <div className="justify-center text-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    Update Password
                  </div>
                  <div className="justify-center text-neutral-600 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">
                    Set a new password for your account
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

                {/* New Password field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        New Password
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    icon={true}
                  />
                </div>

                {/* Confirm Password field */}
                <div className="self-stretch rounded flex flex-col justify-center items-start gap-2">
                  <div className="self-stretch inline-flex justify-start items-start gap-2">
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex-1 justify-start text-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        Confirm Password
                      </div>
                    </div>
                  </div>
                  <TextInput
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    icon={true}
                  />
                </div>

                {/* Update Password button */}
                <Button
                  type="submit"
                  variant="affirmative"
                  className="self-stretch"
                >
                  Update Password
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
