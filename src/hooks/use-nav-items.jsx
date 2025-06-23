import { Home, RotateCcw, Star, CircleUser } from "lucide-react";

export const useNavItems = () => {
  const navItems = [
    { to: "/", label: "Home", icon: <Home className="size-5" /> },
    { to: "/programs", label: "Programs", icon: <Star className="size-5" /> },
    {
      to: "/history",
      label: "History",
      icon: <RotateCcw className="size-5" />,
    },
    {
      to: "/account",
      label: "Account",
      icon: <CircleUser className="size-5" />,
    },
  ];

  return navItems;
};
