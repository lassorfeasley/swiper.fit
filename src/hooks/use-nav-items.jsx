import { Home, RotateCcw, Star, Play } from "lucide-react";
import { useLocation } from "react-router-dom";

export const useNavItems = () => {
  const { pathname } = useLocation();
  const navItems = [
    { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
    { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
    {
      to: "/history",
      label: "History",
      icon: <RotateCcw className="w-7 h-7" />,
    },
  ];

  if (pathname.includes("workout/active")) {
    navItems.push({
      to: "/workout",
      label: "Workout",
      icon: <Play className="w-7 h-7" />,
    });
  }

  return navItems;
};
