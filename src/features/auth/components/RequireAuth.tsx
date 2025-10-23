import React, { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!session) {
      navigate("/");
    } else if (location.search.includes('type=recovery')) {
      // Handle magic link sign in
      navigate('/update-password');
    }
  }, [session, navigate, location.search]);

  if (!session) return null;
  return <Outlet />;
}
