import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Train } from "@/features/workout";
import Home from "./pages/Home/Home.tsx";
import Landing from "./pages/Landing/Landing.tsx";
import { Routines, PublicRoutine, RoutineBuilder } from "@/features/routines";
import { History, CompletedWorkout } from "@/features/history";
import { ActiveWorkout } from "@/features/workout";
import "./App.css";
import {
  NavBarVisibilityProvider,
  useNavBarVisibility,
} from "@/contexts/NavBarVisibilityContext";
import React, { createContext, useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { Login, CreateAccount, PasswordReset, UpdatePassword, RequireAuth } from "@/features/auth";
import { ActiveWorkoutProvider, useActiveWorkout } from "./contexts/ActiveWorkoutContext";
import OGImageAdmin from "./pages/OGImageAdmin";
import MobileNav from "./components/layout/MobileNav";
import SideBarNav from "./components/layout/SideBarNav";
import { LoggedOutNav } from "@/features/auth";
import Account from "./pages/Account/Account.tsx";
import EmailTest from "./pages/EmailTest";

import { AccountProvider, useAccount } from "@/contexts/AccountContext";

interface PageNameContextType {
  setPageName: (name: string) => void;
  pageName: string;
}

export const PageNameContext = createContext<PageNameContextType>({
  setPageName: () => {},
  pageName: "",
});

function AppContent() {
  const location = useLocation();
  const { isWorkoutActive, loading: workoutLoading } = useActiveWorkout();
  const { isDelegated } = useAccount();
  const navigate = useNavigate();
  const { navBarVisible } = useNavBarVisibility();
  // Force scroll to top on route changes (prevents residual scroll from previous pages)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    } catch (_) {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  const isProgramDetailOrEditOrCreateOrLoginPage =
    /^\/routines\/[^/]+(\/edit|\/configure)?$/.test(location.pathname) ||
    location.pathname === "/create_or_edit_exercise_demo" ||
    location.pathname === "/login" ||
    location.pathname === "/create-account" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/update-password";

  // Check if current route is authenticated
  const isAuthenticatedRoute = ![
    "/",
    "/login",
    "/create-account",
    "/reset-password",
  ].includes(location.pathname);

  // Detect public shared views (history list, workout, or routine)
  const isPublicHistoryView = /^\/(app\/)?history\/public\//.test(location.pathname);
  const isPublicRoutineView = /^\/(app\/)?routines\/public\//.test(location.pathname);
  const hideNavForPublic = isPublicHistoryView || isPublicRoutineView;

  // Define paths that should be allowed even when workout is active
  // When a workout is active, users should ONLY be able to access the workout page and essential auth pages
  const allowedPaths = [
    '/workout/active',           // The active workout page itself
    '/',                         // Landing page (for logout)
    '/login',                    // Authentication pages
    '/create-account',
    '/reset-password',
    '/update-password',
    '/og-env'                    // Allow OG Env while workout is active for testing
  ];
  
  // Check if current path is allowed
  // When any workout is active (delegate or regular user), be very restrictive
  // BUT always allow login and create-account pages
  const isAllowedPath = isWorkoutActive 
    ? ['/workout/active', '/', '/login', '/create-account', '/reset-password', '/update-password'].some(allowed => {
        if (allowed === '/') {
          return location.pathname === '/';
        }
        // More precise path matching - exact match or starts with allowed path followed by /
        return location.pathname === allowed || location.pathname.startsWith(allowed + '/');
      }) || ['/login', '/create-account'].includes(location.pathname)
    : true; // If no workout is active, allow all paths
  

  
  // Guard: If workout is active and we're on a non-allowed page, immediately redirect
  // Don't redirect while workout context is still loading to avoid premature redirects
  // Delegates should NEVER be redirected to active workouts - they should be able to manage accounts freely
  const shouldRedirect = isWorkoutActive && !isAllowedPath && !workoutLoading && !isDelegated;

  // Debug logging for workout redirect logic
  useEffect(() => {
      console.log('[App] Workout redirect state:', {
      isWorkoutActive,
      workoutLoading,
      isAllowedPath,
      shouldRedirect,
      currentPath: location.pathname,
      isDelegated,
      allowedPaths: ['/workout/active', '/', '/login', '/create-account', '/reset-password', '/update-password', '/og-env']
    });
    
    // Additional debugging for path matching
    if (isWorkoutActive) {
      const pathChecks = ['/workout/active', '/', '/login', '/create-account', '/reset-password', '/update-password', '/og-env'].map(allowed => {
        const isMatch = allowed === '/' ? location.pathname === '/' : 
                       location.pathname === allowed || location.pathname.startsWith(allowed + '/');
        return { allowed, isMatch };
      });
      console.log('[App] Path matching details:', pathChecks);
    }
  }, [isWorkoutActive, workoutLoading, isAllowedPath, shouldRedirect, location.pathname, isDelegated]);

  // Redirect to active workout when one is live
  useEffect(() => {
    if (shouldRedirect) {
      console.log('[App] Redirecting to active workout');
      console.log('[App] Redirect details:', {
        isWorkoutActive,
        workoutLoading,
        isAllowedPath,
        currentPath: location.pathname,
        isDelegated
      });
      navigate('/workout/active', { replace: true });
    }
  }, [shouldRedirect, navigate, isWorkoutActive, workoutLoading, isAllowedPath, location.pathname, isDelegated]);

  // Immediate redirect when workout context finishes loading and detects active workout
  // But NEVER redirect delegates - they should be able to manage accounts freely
  useEffect(() => {
    if (!workoutLoading && isWorkoutActive && location.pathname !== '/workout/active' && !isDelegated) {
      console.log('[App] Immediate redirect to active workout after loading');
      navigate('/workout/active', { replace: true });
    }
  }, [workoutLoading, isWorkoutActive, location.pathname, navigate]);

  // Additional safety checks: immediately redirect if on restricted pages with active workout
  useEffect(() => {
    if (!workoutLoading && isWorkoutActive) {
      const restrictedPaths = ['/routines', '/history', '/trainers', '/account', '/dashboard'];
      const isOnRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path));
      
      // Delegates should NEVER be redirected - they can access all pages freely
      if (isOnRestrictedPath && location.pathname !== '/workout/active' && !isDelegated) {
        console.log('[App] Safety redirect: on restricted page with active workout:', location.pathname);
        navigate('/workout/active', { replace: true });
      }
    }
  }, [workoutLoading, isWorkoutActive, location.pathname, navigate, isDelegated]);

  // Show loading state while workout context is loading to prevent premature navigation
  if (workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking for active workouts...</p>
        </div>
      </div>
    );
  }

  // Don't render any content if we should be redirecting - this prevents the page from showing briefly
  // BUT allow login and create-account pages even when there's an active workout
  if (shouldRedirect && !['/login', '/create-account'].includes(location.pathname)) {
    return null;
  }


  
  return (
    <div className="min-h-screen relative overflow-auto">
      {/* Persistent LoggedOutNav for unauthenticated routes */}
      {!isAuthenticatedRoute && <LoggedOutNav showAuthButtons={true} />}
      
      {/* Main Content */}
      <main className="min-h-screen">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* Protected routes wrapper */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/train" element={<Train />} />
            <Route path="/routines" element={<Routines />} />
            <Route
              path="/routines/:programId/configure"
              element={<RoutineBuilder />}
            />
            <Route path="/history" element={<History />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/og-image-admin" element={<OGImageAdmin />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
            {(((typeof window !== 'undefined' && window.location.hostname === 'staging.swiper.fit')) || import.meta.env.MODE === 'development') && (
              <Route path="/email-test" element={<EmailTest />} />
            )}

          </Route>

          {/* Public shared history route (unauthenticated) */}
          <Route path="/history/public/:userId" element={<History />} />
          {/* App-prefixed alias used by OG pages */}
          <Route path="/app/history/public/:userId" element={<History />} />
          {/* Public shared single workout view (unauthenticated) */}
          <Route path="/history/public/workout/:workoutId" element={<CompletedWorkout />} />
          {/* App-prefixed alias used by OG pages */}
          <Route path="/app/history/public/workout/:workoutId" element={<CompletedWorkout />} />
          {/* Public shared routine view (unauthenticated) */}
          <Route path="/routines/public/:routineId" element={<PublicRoutine />} />
          {/* App-prefixed alias used by OG pages */}
          <Route path="/app/routines/public/:routineId" element={<PublicRoutine />} />
        </Routes>
      </main>

      {/* Show normal navigation only when no workout is active and not delegated */}
      {isAuthenticatedRoute && !hideNavForPublic && !isWorkoutActive && !isDelegated && !isProgramDetailOrEditOrCreateOrLoginPage && <MobileNav />}
      {/* SideBarNav is now rendered by AppLayout on each page, so remove global instance */}
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
        <AccountProvider>
          <ActiveWorkoutProvider>
            <PageNameContext.Provider value={{ pageName, setPageName }}>
              <NavBarVisibilityProvider>
                <AppContent />
              </NavBarVisibilityProvider>
            </PageNameContext.Provider>
          </ActiveWorkoutProvider>
        </AccountProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
