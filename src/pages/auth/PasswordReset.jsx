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
    <AppLayout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="text-slate-600 text-xl font-medium leading-9 mb-2">
              Forgot your password?
            </div>
            <div className="text-slate-600 text-sm font-normal mb-4">
              Enter your email and we'll send you a link to reset your password.
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
              <TextInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full h-[56px]">
                Send reset link
              </Button>
            </form>
            <div
              className="text-slate-600 text-sm font-normal leading-tight cursor-pointer text-center mt-2"
              onClick={() => navigate("/login")}
            >
              Back to login
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
