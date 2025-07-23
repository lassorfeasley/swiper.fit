import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { Alert } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { AlertDescription } from "@/components/atoms/alert";
import { AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { TextInput } from "@/components/molecules/text-input";
import {
  SwiperCard,
  SwiperCardContent,
} from "@/components/molecules/swiper-card";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const navigate = useNavigate();

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
      // Navigate to routines page after a short delay
      setTimeout(() => navigate("/routines"), 2000);
    }
  };

  return (
    <AppLayout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <SwiperCard className="w-full max-w-md mx-4">
          <SwiperCardContent className="flex flex-col gap-5 p-5">
            <div className="text-slate-600 text-xl font-medium leading-9 mb-2">
              Update Password
            </div>
            <div className="text-slate-600 text-sm font-normal mb-4">
              Set a new password for your account
            </div>
            {status.type === "error" && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}
            {status.type === "success" && (
              <Alert className="mb-2 bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-slate-600 text-sm font-bold">
                  New Password
                </label>
                <TextInput
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  icon={<Eye className="size-6 text-neutral-300" />}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-600 text-sm font-bold">
                  Confirm Password
                </label>
                <TextInput
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={<Eye className="size-6 text-neutral-300" />}
                />
              </div>
              <Button type="submit" className="w-full h-[56px]">
                Update Password
              </Button>
            </form>
          </SwiperCardContent>
        </SwiperCard>
      </div>
    </AppLayout>
  );
}
