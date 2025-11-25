import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, lazy, createContext, useState, useEffect } from "react";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
// Eagerly load critical routes
import Landing from "./pages/Landing/Landing.tsx";
import { Login, CreateAccount, PasswordReset, UpdatePassword, RequireAuth, LoggedOutNav } from "@/features/auth";
// Lazy routes
const Home = lazy(() => import("./pages/Home/Home.tsx"));
const Train = lazy(() =>
  import("@/features/workout").then((module) => ({ default: module.Train }))
);
const ActiveWorkout = lazy(() =>
  import("@/features/workout").then((module) => ({ default: module.ActiveWorkout }))
);
const Routines = lazy(() =>
  import("@/features/routines").then((module) => ({ default: module.Routines }))
);
const RoutineBuilder = lazy(() =>
  import("@/features/routines").then((module) => ({ default: module.RoutineBuilder }))
);
const History = lazy(() =>
  import("@/features/history").then((module) => ({ default: module.History }))
);
const CompletedWorkout = lazy(() =>
  import("@/features/history").then((module) => ({ default: module.CompletedWorkout }))
);
const Account = lazy(() => import("./pages/Account/Account.tsx"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite.tsx"));
import "./App.css";
import {
  NavBarVisibilityProvider,
  useNavBarVisibility,
} from "@/contexts/NavBarVisibilityContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ActiveWorkoutProvider, useActiveWorkout } from "./contexts/ActiveWorkoutContext";
import OGImageAdmin from "./pages/OGImageAdmin";
import MobileNav from "./components/layout/MobileNav";
import SideBarNav from "./components/layout/SideBarNav";
import EmailTest from "./pages/EmailTest";
import ButtonTest from "./pages/ButtonTest";
import ComponentsGallery from "./pages/ComponentsGallery";
import { Toaster } from "sonner";

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
  const { session } = useAuth();
  const { isWorkoutActive, loading: workoutLoading, isStartingWorkout, isFinishing } = useActiveWorkout();
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
    /^\/routines\/[^/]+$/.test(location.pathname) ||
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

  // Unified URLs - no longer need to detect public vs private routes
  const hideNavForPublic = false;

  // Define paths that should be allowed even when workout is active
  // When a workout is active, users should ONLY be able to access the workout page and essential auth pages
  const allowedPaths = [
    '/workout/active',           // The active workout page itself
    '/',                         // Landing page (for logout)
    '/login',                    // Authentication pages
    '/create-account',
    '/reset-password',
    '/update-password',
    '/accept-invite',
    '/og-env'                    // Allow OG Env while workout is active for testing
  ];
  
  // Check if current path is allowed
  // When any workout is active (delegate or regular user), be very restrictive
  // BUT always allow login and create-account pages
  const alwaysAllowed = ['/login', '/create-account', '/accept-invite'];
  const isAllowedPath = isWorkoutActive 
    ? ['/workout/active', '/', '/login', '/create-account', '/reset-password', '/update-password', '/accept-invite'].some(allowed => {
        if (allowed === '/') {
          return location.pathname === '/';
        }
        // More precise path matching - exact match or starts with allowed path followed by /
        return location.pathname === allowed || location.pathname.startsWith(allowed + '/');
      }) || alwaysAllowed.includes(location.pathname)
    : true; // If no workout is active, allow all paths
  

  
  // Guard: If workout is active and we're on a non-allowed page, immediately redirect
  // Don't redirect while workout context is still loading to avoid premature redirects
  // Delegates should NEVER be redirected to active workouts - they should be able to manage accounts freely
  const shouldRedirect = isWorkoutActive && !isAllowedPath && !workoutLoading && !isDelegated;

  // Redirect to active workout when one is live
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/workout/active', { replace: true });
    }
  }, [shouldRedirect, navigate]);

  // Immediate redirect when workout context finishes loading and detects active workout
  // But NEVER redirect delegates - they should be able to manage accounts freely
  useEffect(() => {
    if (!workoutLoading && isWorkoutActive && location.pathname !== '/workout/active' && !isDelegated) {
      navigate('/workout/active', { replace: true });
    }
  }, [workoutLoading, isWorkoutActive, location.pathname, navigate, isDelegated]);
  
  // For delegates (trainers) with active workout, also redirect to /workout/active but ONLY from /routines
  // This prevents trainers from getting stuck on the routines page when switching to a client with an active workout
  useEffect(() => {
    if (!workoutLoading && isWorkoutActive && isDelegated && location.pathname === '/routines') {
      navigate('/workout/active', { replace: true });
    }
  }, [workoutLoading, isWorkoutActive, isDelegated, location.pathname, navigate]);

  // Additional safety checks: immediately redirect if on restricted pages with active workout
  useEffect(() => {
    if (!workoutLoading && isWorkoutActive) {
      const restrictedPaths = ['/routines', '/history', '/trainers', '/account', '/dashboard'];
      const isOnRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path));
      
      // Don't redirect if we're on /account with a section param (explicit navigation, e.g., exiting manage mode)
      const isExplicitAccountNavigation = location.pathname === '/account' && 
                                         (location.search.includes('section=') || location.state?.exitingDelegation);
      
      // Delegates should NEVER be redirected - they can access all pages freely
      // Also don't redirect if explicitly navigating to account with a section param
      if (isOnRestrictedPath && location.pathname !== '/workout/active' && !isDelegated && !isExplicitAccountNavigation) {
        navigate('/workout/active', { replace: true });
      }
    }
  }, [workoutLoading, isWorkoutActive, location.pathname, location.search, location.state, navigate, isDelegated]);

  // Render loading overlays (manage their own visibility based on animation state)
  // Only show workout checking overlay for authenticated users
  const checkingWorkoutOverlay = (
    <LoadingOverlay 
      isLoading={session && workoutLoading} 
      message="Checking for active workouts..."
    />
  );

  const startingWorkoutOverlay = (
    <LoadingOverlay 
      isLoading={isStartingWorkout} 
      message="Starting workout..."
    />
  );

  const endingWorkoutOverlay = (
    <LoadingOverlay 
      isLoading={isFinishing} 
      message="Finishing workout..."
    />
  );

  // Show loading state while workout context is loading to prevent premature navigation
  // ONLY show for authenticated users
  if (session && workoutLoading) {
    return checkingWorkoutOverlay;
  }

  // Don't render any content if we should be redirecting - this prevents the page from showing briefly
  // BUT allow login and create-account pages even when there's an active workout
  if (shouldRedirect && !['/login', '/create-account'].includes(location.pathname)) {
    return null;
  }


  
  return (
    <>
      {checkingWorkoutOverlay}
      {startingWorkoutOverlay}
      {endingWorkoutOverlay}
      <div className="min-h-screen relative overflow-auto">
      {/* Persistent LoggedOutNav for unauthenticated routes */}
      {!isAuthenticatedRoute && <LoggedOutNav showAuthButtons={true} />}
      
      {/* Main Content */}
      <main className="min-h-screen">
        <Suspense fallback={<LoadingOverlay isLoading message="Loading..." />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* Protected routes wrapper */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/train" element={<Train />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/history" element={<History />} />
              <Route path="/workout/active" element={<ActiveWorkout />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/account" element={<Account />} />
              <Route path="/og-image-admin" element={<OGImageAdmin />} />
              {(((typeof window !== 'undefined' && window.location.hostname === 'staging.swiper.fit')) || import.meta.env.MODE === 'development') && (
                <>
                  <Route path="/email-test" element={<EmailTest />} />
                  <Route path="/button-test" element={<ButtonTest />} />
                  <Route path="/components-gallery" element={<ComponentsGallery />} />
                </>
              )}

            </Route>

            {/* Unified URL routes - work for both owners and viewers */}
            <Route path="/routines/:routineId/configure" element={<RoutineBuilder />} />
            <Route path="/routines/:routineId" element={<RoutineBuilder />} />
            <Route path="/history/workout/:workoutId" element={<CompletedWorkout />} />
            <Route path="/history/:workoutId" element={<CompletedWorkout />} />
            <Route path="/history/:userId" element={<History />} />
          </Routes>
        </Suspense>
      </main>

      {/* Show normal navigation only when no workout is active and not delegated */}
      {session && isAuthenticatedRoute && !hideNavForPublic && !isWorkoutActive && !isDelegated && !isProgramDetailOrEditOrCreateOrLoginPage && navBarVisible && <MobileNav />}
      {/* SideBarNav is now rendered by AppLayout on each page, so remove global instance */}
    </div>
    </>
  );
}

function isClientError(error: unknown): boolean {
  if (!error) return false;
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  if (typeof status === "number") {
    return status >= 400 && status < 500;
  }

  const code = (error as { code?: string })?.code;
  if (typeof code === "string") {
    return ["400", "401", "402", "403", "404", "422"].includes(code);
  }

  return false;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: (failureCount, error) =>
        isClientError(error) ? false : failureCount < 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 5000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) =>
        isClientError(error) ? false : failureCount < 1,
    },
  },
});

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
                <Toaster />
              </NavBarVisibilityProvider>
            </PageNameContext.Provider>
          </ActiveWorkoutProvider>
        </AccountProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
