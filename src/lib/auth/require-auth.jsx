import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export default function RequireAuth() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!session) {
      navigate("/login");
    } else if (location.search.includes("type=recovery")) {
      // Handle magic link sign in
      navigate("/update-password");
    }
  }, [session, navigate, location.search]);

  if (!session) return null;
  return <Outlet />;
}
