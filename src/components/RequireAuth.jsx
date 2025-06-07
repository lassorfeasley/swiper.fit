import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function RequireAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/login");
    });
    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) navigate("/login");
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  return session ? <Outlet /> : null; // <-- This is critical
}
