import { History, Star, Cog, Blend } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

export const useNavItems = () => {
  const { isDelegated } = useAccount();

  const navItems = [
    { to: "/routines", label: "Routines", icon: <Star className="w-6 h-6" /> },
    {
      to: "/history",
      label: "History",
      icon: <History className="w-6 h-6" />,
    },
    {
      to: "/sharing",
      label: "Sharing",
      icon: <Blend className="w-6 h-6" />,
      disabled: isDelegated,
    },
    {
      to: "/account",
      label: "Account",
      icon: <Cog className="w-6 h-6" />,
      disabled: isDelegated,
    },
  ];

  return navItems;
};
