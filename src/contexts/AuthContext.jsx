import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global error handler for auth errors
  useEffect(() => {
    const handleAuthError = (error) => {
      if (error?.message?.includes('Invalid Refresh Token') || 
          error?.message?.includes('Refresh Token Not Found') ||
          error?.message?.includes('JWT expired')) {
        console.log('AuthProvider: Auth error detected, signing out:', error.message);
        supabase.auth.signOut();
      }
    };

    // Listen for unhandled promise rejections that might be auth errors
    window.addEventListener('unhandledrejection', (event) => {
      handleAuthError(event.reason);
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleAuthError);
    };
  }, []);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state change listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, session });
      setSession(session);
      setLoading(false);
    });

    // Get initial session
    console.log('AuthProvider: Getting initial session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session:', session);
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.error('AuthProvider: Error getting initial session:', error);
      // If we get an auth error, clear the session and sign out
      if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
        console.log('AuthProvider: Invalid refresh token detected, signing out');
        supabase.auth.signOut();
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth state change listener');
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user || null,
    signOut: () => supabase.auth.signOut(),
  };

  console.log('AuthProvider: Current auth state:', value);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 