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
    });

    // Get initial session
    console.log('AuthProvider: Getting initial session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session:', session);
      setSession(session);
      setLoading(false);
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
