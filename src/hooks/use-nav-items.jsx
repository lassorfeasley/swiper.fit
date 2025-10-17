import { History, Star, Cog, Blend } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

export const useNavItems = () => {
  const { isDelegated } = useAccount();

  const navItems = [
    { to: "/routines", label: "Routines", icon: <Star className="w-6 h-6" />, showSubtext: false },
    { to: "/history", label: "History", icon: <History className="w-6 h-6" />, showSubtext: false },
    { to: "/trainers", label: "Trainers", icon: <Blend className="w-6 h-6" />, disabled: isDelegated, subtext: 'Coming soon', showSubtext: false },
    { to: "/account", label: "Account", icon: <Cog className="w-6 h-6" />, disabled: isDelegated, showSubtext: false },
  ];

  return navItems;
};
