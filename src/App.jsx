import { Routes, Route, Link, useLocation } from "react-router-dom";
// import { MdHome, MdDirectionsRun, MdHistory, MdAddCircle } from "react-icons/md";
import {
  Home as HomeIcon,
  Star,
  RotateCcw,
  Play,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import Programs from "./pages/programs";
import History from "./pages/history";
import Workout from "./pages/workout";
import CompletedWorkout from "./pages/History/CompletedWorkout";
import AppHeaderDemo from "./pages/Sandbox/AppHeaderDemo";
import CreateOrEditExerciseDemo from "./pages/Sandbox/CreateOrEditExerciseDemo";
import ProgramBuilder from "./pages/Programs/ProgramBuilder";
import "./App.css";
import { NavBarVisibilityProvider, useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import React, { createContext, useState, useEffect } from "react";
import NavBar from "./components/layout/NavBar";
import SetCardDemo from "./pages/Sandbox/SetCardDemo";
import SwipeSwitchDemo from "./pages/Sandbox/SwipeSwitchDemo";
import { AuthProvider } from './contexts/AuthContext';
import Login from "./pages/auth/Login";
import CreateAccount from "./pages/auth/CreateAccount";
import PasswordReset from "./pages/auth/PasswordReset";
import UpdatePassword from "./pages/auth/UpdatePassword";
import RequireAuth from "@/lib/auth/RequireAuth";

export const PageNameContext = createContext({
  setPageName: () => {},
  pageName: "",
});

function PageNameFooter() {
  const { pageName } = React.useContext(PageNameContext);
  if (!pageName) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        left: 0,
        width: "100vw",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <span
        style={{
          background: "rgba(30,30,40,0.5)",
          color: "#fff",
          fontSize: 12,
          borderRadius: 8,
          padding: "2px 12px",
          opacity: 0.7,
        }}
      >
        {pageName}
      </span>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { navBarVisible } = useNavBarVisibility();
  const navItems = [
    { to: "/", label: "Home", icon: <HomeIcon className="w-7 h-7" /> },
    {
      to: "/programs",
      label: "Programs",
      icon: <Star className="w-7 h-7" />,
    },
    {
      to: "/history",
      label: "History",
      icon: <RotateCcw className="w-7 h-7" />,
    },
    {
      to: "/workout",
      label: "Workout",
      icon: <Play className="w-7 h-7" />,
    },
  ];

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
            <Route path="/programs/:programId/configure" element={<ProgramBuilder />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/app-header-demo" element={<AppHeaderDemo />} />
            <Route
              path="/create_or_edit_exercise_demo"
              element={<CreateOrEditExerciseDemo />}
            />
            <Route path="/demo/setcard" element={<SetCardDemo />} />
            <Route path="/demo/swipeswitch" element={<SwipeSwitchDemo />} />
          </Route>
        </Routes>
      </main>

      {/* Navigation bar */}
      {navBarVisible && !isProgramDetailOrEditOrCreateOrLoginPage && (
        <NavBar navItems={navItems} />
      )}
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
        <PageNameContext.Provider value={{ pageName, setPageName }}>
          <NavBarVisibilityProvider>
            <AppContent />
          </NavBarVisibilityProvider>
        </PageNameContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
