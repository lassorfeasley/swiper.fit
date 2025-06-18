import { Home, RotateCcw, Star } from "lucide-react";

export const useNavItems = () => {
  const navItems = [
    { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
    { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
    {
      to: "/history",
      label: "History",
      icon: <RotateCcw className="w-7 h-7" />,
    },
  ];

  return navItems;
};
