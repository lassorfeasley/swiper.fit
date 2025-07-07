import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home/Home";
import Routines from "./pages/Routines/Routines";
import History from "./pages/History/History";
import ActiveWorkout from "./pages/Workout/ActiveWorkout";
import CompletedWorkout from "./pages/History/CompletedWorkout";
import RoutineBuilder from "./pages/Routines/RoutineBuilder";
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
import { ActiveWorkoutProvider, useActiveWorkout } from "./contexts/ActiveWorkoutContext";
import DemoPage from "./pages/Sandbox/DemoPage";
import MobileNav from "./components/organisms/mobile-nav";
import SideBarNav from "./components/organisms/side-bar-nav";
import Account from "./pages/Account/Account";
import { Toaster } from "sonner";
import Workout from "./pages/Workout/Workout";

export const PageNameContext = createContext({
  setPageName: () => {},
  pageName: "",
});

function AppContent() {
  const location = useLocation();
  const { isWorkoutActive } = useActiveWorkout();
  const navigate = useNavigate();
  const { navBarVisible } = useNavBarVisibility();

  const isProgramDetailOrEditOrCreateOrLoginPage =
    /^\/routines\/[^/]+(\/edit)?$/.test(location.pathname) ||
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

  // Redirect to active workout when one is live
  useEffect(() => {
    const path = location.pathname;
    // Only redirect to active workout when not on history pages
    if (isWorkoutActive && !path.startsWith('/history') && path !== '/workout/active') {
      navigate('/workout/active', { replace: true });
    }
  }, [isWorkoutActive, location.pathname, navigate]);

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
            <Route path="/routines" element={<Routines />} />
            <Route
              path="/routines/:programId/configure"
              element={<RoutineBuilder />}
            />
            <Route path="/history" element={<History />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
            <Route path="/workout" element={<Workout />} />
          </Route>

          {/* Public shared history route (unauthenticated) */}
          <Route path="/history/public/:userId" element={<History />} />
          {/* Public shared single workout view (unauthenticated) */}
          <Route path="/history/public/workout/:workoutId" element={<CompletedWorkout />} />
        </Routes>
      </main>

      {/* Show normal navigation only when no workout is active */}
      {isAuthenticatedRoute && !hideNavForPublic && !isWorkoutActive && <MobileNav />}
      {isAuthenticatedRoute && !hideNavForPublic && !isWorkoutActive && <SideBarNav />}

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
