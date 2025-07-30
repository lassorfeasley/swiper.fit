import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// Context to expose account-switching helpers
const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const { user: authUser } = useAuth(); // signed-in user
  const navigate = useNavigate();
  const location = useLocation();

  const [actingUser, setActingUser] = useState(null); // delegator we are impersonating
  const [loading, setLoading] = useState(true);

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

  const switchToUser = (profile) => {
    if (!profile || profile.id === authUser.id) {
      returnToSelf();
      return;
    }
    setActingUser(profile);
    localStorage.setItem("actingUserId", profile.id);
  };

  const returnToSelf = () => {
    setActingUser(null);
    localStorage.removeItem("actingUserId");
    // Always return to sharing page when exiting delegate mode
    navigate("/sharing");
  };

  // The user the app should act as for queries
  const currentUser = actingUser || authUser;
  const isDelegated = Boolean(actingUser);
  
  // Debug logging for user changes
  useEffect(() => {
    console.log('[AccountContext] User state changed:', {
      authUserId: authUser?.id,
      actingUserId: actingUser?.id,
      currentUserId: currentUser?.id,
      isDelegated,
      loading
    });
  }, [authUser?.id, actingUser?.id, currentUser?.id, isDelegated, loading]);

  return (
    <AccountContext.Provider
      value={{ authUser, currentUser, isDelegated, actingUser, switchToUser, returnToSelf, loading }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
};

// Convenience hook – mirrors previous usage where components expected `user`
export const useCurrentUser = () => {
  const { currentUser } = useAccount();
  return currentUser;
}; 