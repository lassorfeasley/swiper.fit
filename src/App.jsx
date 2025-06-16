import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/home/home";
import Programs from "./pages/programs/programs";
import History from "./pages/history/history";
import Workout from "./pages/workout/workout";
import ActiveWorkout from "./pages/workout/active-workout";
import CompletedWorkout from "./pages/history/completed-workout";
import ProgramBuilder from "./pages/programs/program-builder";
import "./app.css";
import { NavBarVisibilityProvider } from "@/contexts/navbar-visibility-context";
import React, { useEffect } from "react";
import { AuthProvider } from "./contexts/auth-context";
import Login from "./pages/auth/login";
import CreateAccount from "./pages/auth/create-account";
import PasswordReset from "./pages/auth/password-reset";
import UpdatePassword from "./pages/auth/update-password";
import RequireAuth from "@/lib/auth/require-auth";
import { ActiveWorkoutProvider } from "./contexts/active-workout-context";
import { PageNameProvider } from "./contexts/page-name-context";
import DemoPage from "./pages/sandbox/demo-page";

function AppContent() {
  const location = useLocation();

  const isProgramDetailOrEditOrCreateOrLoginPage =
    /^\/programs\/[^/]+(\/edit)?$/.test(location.pathname) ||
    location.pathname === "/create_or_edit_exercise_demo" ||
    location.pathname === "/login" ||
    location.pathname === "/create-account" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/update-password";

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* Protected routes wrapper */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Home />} />
            <Route path="/programs" element={<Programs />} />
            <Route
              path="/programs/:programId/configure"
              element={<ProgramBuilder />}
            />
            <Route path="/history" element={<History />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/demo" element={<DemoPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      document.body.setAttribute("data-env", "development");
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveWorkoutProvider>
          <PageNameProvider>
            <NavBarVisibilityProvider>
              <AppContent />
            </NavBarVisibilityProvider>
          </PageNameProvider>
        </ActiveWorkoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
