import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { flushSync } from "react-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AccountContextType {
  authUser: User | null;
  currentUser: User | Profile | null;
  isDelegated: boolean;
  actingUser: Profile | null;
  switchToUser: (profile: Profile) => void;
  returnToSelf: () => void;
  loading: boolean;
}

// Context to expose account-switching helpers
const AccountContext = createContext<AccountContextType | null>(null);

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider = ({ children }: AccountProviderProps) => {
  const { user: authUser } = useAuth(); // signed-in user
  const navigate = useNavigate();
  const location = useLocation();

  const [actingUser, setActingUser] = useState<Profile | null>(null); // delegator we are impersonating
  const [loading, setLoading] = useState<boolean>(true);

  // On mount or when authUser changes, hydrate actingUser from localStorage
  useEffect(() => {
    if (!authUser) return;
    const storedId = localStorage.getItem("actingUserId");
    if (!storedId || storedId === authUser.id) {
      setActingUser(null);
      setLoading(false);
      return;
    }
    // Fetch basic profile info for the stored user
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("id", storedId)
        .single();
      if (error) {
        console.warn("[AccountContext] Failed to load stored acting user", error);
        localStorage.removeItem("actingUserId");
        setActingUser(null);
      } else {
        setActingUser(data);
      }
      setLoading(false);
    })();
  }, [authUser]);

  const switchToUser = (profile: Profile) => {
    if (!profile || profile.id === authUser?.id) {
      returnToSelf();
      return;
    }
    setActingUser(profile);
    localStorage.setItem("actingUserId", profile.id);
  };

  const returnToSelf = () => {
    // Use flushSync to force synchronous state update before navigation
    // This ensures isDelegated is false when Account component renders
    flushSync(() => {
      setActingUser(null);
      localStorage.removeItem("actingUserId");
    });
    
    // Navigate to clients section with state flag to prevent redirect (backup)
    // The section=clients param is critical - it signals explicit navigation
    navigate("/account?section=clients", { 
      replace: true,
      state: { exitingDelegation: true }
    });
  };

  // The user the app should act as for queries
  const currentUser = actingUser || authUser;
  const isDelegated = Boolean(actingUser);

  return (
    <AccountContext.Provider
      value={{ authUser, currentUser, isDelegated, actingUser, switchToUser, returnToSelf, loading }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
};

// Convenience hook – mirrors previous usage where components expected `user`
export const useCurrentUser = (): User | Profile | null => {
  const { currentUser } = useAccount();
  return currentUser;
};
