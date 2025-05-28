import { Routes, Route, Link, useLocation } from "react-router-dom";
import { MdHome, MdDirectionsRun, MdHistory, MdAddCircle } from "react-icons/md";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import History from "./pages/History";
import Workout from "./pages/Workout";
import WorkoutHistoryDetail from "./pages/WorkoutHistoryDetail";
import ProgramDetail from "./pages/ProgramDetail";
import EditProgram from "./pages/EditProgram";
import AppHeaderDemo from "./pages/AppHeaderDemo";
import CreateNewProgram from "./pages/CreateNewProgram";
import CreateOrEditExerciseDemo from './pages/CreateOrEditExerciseDemo';
import ConfigureProgramExercises from './pages/configure_program_exercises.jsx';
import "./App.css";
import { NavBarVisibilityProvider, useNavBarVisibility } from "./NavBarVisibilityContext";

function AppContent() {
  const location = useLocation();
  const { navBarVisible } = useNavBarVisibility();
  const navItems = [
    { to: "/", label: "Home", icon: <MdHome size={32} /> },
    { to: "/programs", label: "Programs", icon: <MdDirectionsRun size={32} /> },
    { to: "/history", label: "History", icon: <MdHistory size={32} /> },
    { to: "/workout", label: "Workout", icon: <MdAddCircle size={32} /> },
  ];

  // Hide nav bar on Program Detail, Edit Program, Create New Program, or Create/Edit Exercise Demo page
  const isProgramDetailOrEditOrCreatePage =
    /^\/programs\/[^/]+(\/edit)?$/.test(location.pathname) ||
    location.pathname === '/create_new_program' ||
    location.pathname === '/create_or_edit_exercise_demo';

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
          <Route path="/programs/:programId/edit" element={<EditProgram />} />
          <Route path="/programs/:programId/configure" element={<ConfigureProgramExercises />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:workoutId" element={<WorkoutHistoryDetail />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/app-header-demo" element={<AppHeaderDemo />} />
          <Route path="/create_new_program" element={<CreateNewProgram />} />
          <Route path="/create_or_edit_exercise_demo" element={<CreateOrEditExerciseDemo />} />
        </Routes>
      </main>

      {/* Navigation bar */}
      {navBarVisible && !isProgramDetailOrEditOrCreatePage && (
        <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-lg px-8 py-4 flex space-x-12 z-50">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center text-gray-700 font-semibold transition-colors duration-150 ${location.pathname === item.to ? "text-black" : "text-gray-700"}`}
            >
              {item.icon}
              <span className="mt-1 text-base">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <NavBarVisibilityProvider>
      <AppContent />
    </NavBarVisibilityProvider>
  );
}
