import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state change listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, session });
      setSession(session);
      setLoading(false);

      // Handle password recovery - redirect to update password page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('AuthProvider: Password recovery event detected, redirecting to /update-password');
        // Use setTimeout to ensure navigation happens after React Router is ready
        setTimeout(() => {
          if (window.location.pathname !== '/update-password') {
            window.location.href = '/update-password';
          }
        }, 100);
      }
    });

    // Get initial session and check for recovery token in hash
    console.log('AuthProvider: Getting initial session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session:', session);
      setSession(session);
      setLoading(false);

      // Check if we have a recovery token in the hash fragment
      // Supabase password reset links use: #access_token=...&type=recovery
      const hash = window.location.hash;
      if (hash.includes('type=recovery') && session) {
        console.log('AuthProvider: Recovery token detected in hash, redirecting to /update-password');
        // Clean up the hash from URL and redirect
        const currentPath = window.location.pathname;
        if (currentPath !== '/update-password') {
          // Remove hash and redirect
          window.history.replaceState(null, '', currentPath);
          window.location.href = '/update-password';
        } else {
          // Already on update-password, just clean up the hash
          window.history.replaceState(null, '', '/update-password');
        }
      }
    }).catch(error => {
      console.error('AuthProvider: Error getting initial session:', error);
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth state change listener');
      subscription?.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user || null,
  };

  console.log('AuthProvider: Current auth state:', value);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
