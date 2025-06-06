import { Routes, Route, Link, useLocation } from "react-router-dom";
// import { MdHome, MdDirectionsRun, MdHistory, MdAddCircle } from "react-icons/md";
import { HomeIcon, StarIcon, ArrowPathIcon, PlayIcon } from '@heroicons/react/24/solid';
import Home from "./pages/Home";
import Programs from "./pages/programs";
import History from "./pages/history";
import Workout from "./pages/workout";
import WorkoutHistoryDetail from "./pages/workoutHistoryDetail";
import EditProgram from "./pages/Programs/EditProgram";
import AppHeaderDemo from "./pages/DemoPages/AppHeaderDemo";
import CreateNewProgram from "./pages/Programs/CreateNewProgram";
import CreateOrEditExerciseDemo from './pages/DemoPages/CreateOrEditExerciseDemo';
import ConfigureProgramExercises from './pages/configure_program_exercises';
import FormFieldDemo from './pages/DemoPages/FormFieldDemo';
import "./App.css";
import { NavBarVisibilityProvider, useNavBarVisibility } from "./NavBarVisibilityContext";
import React, { createContext, useState, useEffect } from 'react';
import NavBar from "./components/layout/NavBar";
import SetCardDemo from "./pages/DemoPages/SetCardDemo";
import SwipeSwitchDemo from "./pages/DemoPages/SwipeSwitchDemo";
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import CreateAccount from './pages/CreateAccount';

export const PageNameContext = createContext({ setPageName: () => {}, pageName: '' });

function PageNameFooter() {
  const { pageName } = React.useContext(PageNameContext);
  if (!pageName) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 8,
      left: 0,
      width: '100vw',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: 9999,
    }}>
      <span style={{
        background: 'rgba(30,30,40,0.5)',
        color: '#fff',
        fontSize: 12,
        borderRadius: 8,
        padding: '2px 12px',
        opacity: 0.7,
      }}>{pageName}</span>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { navBarVisible } = useNavBarVisibility();
  const navItems = [
    { to: "/", label: "Home", icon: <HomeIcon className="w-7 h-7" /> },
    { to: "/programs", label: "Programs", icon: <StarIcon className="w-7 h-7" /> },
    { to: "/history", label: "History", icon: <ArrowPathIcon className="w-7 h-7" /> },
    { to: "/workout", label: "Workout", icon: <PlayIcon className="w-7 h-7" /> },
  ];

  // Hide nav bar on Program Detail, Edit Program, Create New Program, Create/Edit Exercise Demo, or Login page
  const isProgramDetailOrEditOrCreateOrLoginPage =
    /^\/programs\/[^/]+(\/edit)?$/.test(location.pathname) ||
    location.pathname === '/create_new_program' ||
    location.pathname === '/create_or_edit_exercise_demo' ||
    location.pathname === '/login' ||
    location.pathname === '/create-account';

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
        </Routes>
        <RequireAuth>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/:programId/edit" element={<EditProgram />} />
            <Route path="/programs/:programId/configure" element={<ConfigureProgramExercises />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:workoutId" element={<WorkoutHistoryDetail />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/app-header-demo" element={<AppHeaderDemo />} />
            <Route path="/create_new_program" element={<CreateNewProgram />} />
            <Route path="/create_or_edit_exercise_demo" element={<CreateOrEditExerciseDemo />} />
            <Route path="/demo/setcard" element={<SetCardDemo />} />
            <Route path="/demo/swipeswitch" element={<SwipeSwitchDemo />} />
            <Route path="/demo/form-fields" element={<FormFieldDemo />} />
          </Routes>
        </RequireAuth>
      </main>

      {/* Navigation bar */}
      {navBarVisible && !isProgramDetailOrEditOrCreateOrLoginPage && (
        <NavBar navItems={navItems} />
      )}
    </div>
  );
}

export default function App() {
  const [pageName, setPageName] = useState('');
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      document.body.setAttribute('data-env', 'development');
    }
  }, []);
  return (
    <PageNameContext.Provider value={{ pageName, setPageName }}>
      <NavBarVisibilityProvider>
        <AppContent />
      </NavBarVisibilityProvider>
      <PageNameFooter />
    </PageNameContext.Provider>
  );
}
