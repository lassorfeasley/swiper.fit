import { History, Star, Cog, Blend } from "lucide-react";

export const useNavItems = () => {
  const navItems = [
    { to: "/routines", label: "Routines", icon: <Star className="w-6 h-6" /> },
    {
      to: "/history",
      label: "History",
      icon: <History className="w-6 h-6" />,
    },
    { to: "/sharing", label: "Sharing", icon: <Blend className="w-6 h-6" />, disabled: true },
    {
      to: "/account",
      label: "Account",
      icon: <Cog className="w-6 h-6" />,
    },
  ];

  return navItems;
};
