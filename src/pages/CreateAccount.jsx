import { useState } from "react";
import { supabase } from "../supabaseClient";
import TextField from "../components/common/forms/TextField";
import { Button } from "../components/ui/button";
import { useMutation } from "@tanstack/react-query";
import AppHeader from "../components/layout/AppHeader";

export default function CreateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Signup error:", error);
    },
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    signupMutation.mutate({ email, password });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AppHeader
        appHeaderTitle="Create account"
        subheadText="Create an account"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => window.history.back()}
      />
      <div className="absolute top-0 left-0 w-full h-full z-0 flex flex-col justify-center items-center">
        <div className="flex flex-col gap-4 w-full px-4 lg:w-1/3">
          <TextField
            label="Email"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="create-account-email"
            disabled={signupMutation.isPending}
          />
          <TextField
            label="Password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="create-account-password"
            disabled={signupMutation.isPending}
          />
          <Button
            type="submit"
            data-layer="Button"
            disabled={signupMutation.isPending}
            className="w-full h-[56px]"
            onClick={handleSignup}
          >
            {signupMutation.isPending
              ? "Creating Account..."
              : "Create Account"}
          </Button>
        </div>
        {signupMutation.isError && (
          <div style={{ color: "red", width: "100%" }}>
            {signupMutation.error.message}
          </div>
        )}
        {signupMutation.isSuccess && (
          <div style={{ color: "green", width: "100%" }}>
            Check your email to confirm your account.
          </div>
        )}
      </div>
    </div>
  );
}
