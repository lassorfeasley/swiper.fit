import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useMutation } from "@tanstack/react-query";
import AppHeader from "../components/layout/AppHeader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AppHeader
        appHeaderTitle="Sign in"
        subheadText="Login or create an account"
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={true}
        search={false}
        onBack={() => navigate(-1)}
      />
      <div className="absolute top-0 left-0 w-full h-full z-0 flex flex-col justify-center items-center">
        <div className="flex flex-col gap-4 w-full px-4 lg:w-1/3">
          <Input
            className="bg-white h-[56px]"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
          />
          <Input
            className="bg-white h-[56px]"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginMutation.isPending}
          />
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            onClick={handleLogin}
            className="w-full h-[56px]"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
          <a
            onClick={() => navigate("/create-account")}
            className="text-slate-500 text-base font-normal font-['Space_Grotesk'] cursor-pointer text-center"
          >
            or create an account
          </a>
        </div>
        {loginMutation.isError && (
          <div style={{ color: "red", width: "100%" }}>
            {loginMutation.error.message}
          </div>
        )}
      </div>
    </div>
  );
}
