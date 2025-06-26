import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home/Home";
import Programs from "./pages/Programs/Programs";
import History from "./pages/History/History";
import Workout from "./pages/Workout/Workout";
import ActiveWorkout from "./pages/Workout/ActiveWorkout";
import CompletedWorkout from "./pages/History/CompletedWorkout";
import ProgramBuilder from "./pages/Programs/ProgramBuilder";
import "./App.css";
import {
  NavBarVisibilityProvider,
  useNavBarVisibility,
} from "@/contexts/NavBarVisibilityContext";
import React, { createContext, useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/auth/Login";
import CreateAccount from "./pages/auth/CreateAccount";
import PasswordReset from "./pages/auth/PasswordReset";
import UpdatePassword from "./pages/auth/UpdatePassword";
import RequireAuth from "@/lib/auth/RequireAuth";
import { ActiveWorkoutProvider } from "./contexts/ActiveWorkoutContext";
import DemoPage from "./pages/Sandbox/DemoPage";
import MobileNav from "./components/organisms/mobile-nav";
import SideBarNav from "./components/organisms/side-bar-nav";
import Account from "./pages/Account/Account";
import { Toaster } from "sonner";

export const PageNameContext = createContext({
  setPageName: () => {},
  pageName: "",
});

function AppContent() {
  const location = useLocation();
  const { navBarVisible } = useNavBarVisibility();

  const isProgramDetailOrEditOrCreateOrLoginPage =
    /^\/programs\/[^/]+(\/edit)?$/.test(location.pathname) ||
    location.pathname === "/create_or_edit_exercise_demo" ||
    location.pathname === "/login" ||
    location.pathname === "/create-account" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/update-password";

  // Check if current route is authenticated
  const isAuthenticatedRoute = ![
    "/login",
    "/create-account",
    "/reset-password",
  ].includes(location.pathname);

  // Detect public shared views (history list or workout)
  const isPublicHistoryView = /^\/history\/public\//.test(location.pathname);
  const hideNavForPublic = isPublicHistoryView;

  return (
    <div className="min-h-screen relative">
      {/* Main Content */}
      <main>
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
            <Route path="/workout" element={<Workout />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
          </Route>

          {/* Public shared history route (unauthenticated) */}
          <Route path="/history/public/:userId" element={<History />} />
          {/* Public shared single workout view (unauthenticated) */}
          <Route path="/history/public/workout/:workoutId" element={<CompletedWorkout />} />
        </Routes>
      </main>

      {/* Mobile & Side nav – hidden for public shared links */}
      {isAuthenticatedRoute && !hideNavForPublic && <MobileNav />}
      {isAuthenticatedRoute && !hideNavForPublic && <SideBarNav />}

      {/* Global toast notifications */}
      <Toaster richColors position="top-center" />
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  const [pageName, setPageName] = useState("");
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      document.body.setAttribute("data-env", "development");
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveWorkoutProvider>
          <PageNameContext.Provider value={{ pageName, setPageName }}>
            <NavBarVisibilityProvider>
              <AppContent />
            </NavBarVisibilityProvider>
          </PageNameContext.Provider>
        </ActiveWorkoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
