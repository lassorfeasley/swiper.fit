import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/login");
    });
    
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (!session) {
          navigate("/login");
        } else if (event === 'SIGNED_IN') {
          // Check if this was a magic link sign in
          const isMagicLink = location.search.includes('type=recovery');
          if (isMagicLink) {
            // Redirect to update password page
            navigate('/update-password');
          }
        }
      }
    );
    
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate, location.search]);

  if (loading) return <div>Loading...</div>;

  return session ? <Outlet /> : null;
}
