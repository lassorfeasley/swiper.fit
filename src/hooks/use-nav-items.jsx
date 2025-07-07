import { RotateCcw, Star, Cog, Blend } from "lucide-react";

export const useNavItems = () => {
  const navItems = [
    { to: "/routines", label: "Routines", icon: <Star className="size-5" /> },
    {
      to: "/history",
      label: "History",
      icon: <RotateCcw className="size-5" />,
    },
    {
      to: "/account",
      label: "Account",
      icon: <Cog className="size-5" />,
    },
    { to: "/sharing", label: "Sharing", icon: <Blend className="size-5" />, disabled: true },
  ];

  return navItems;
};
