import { ChartNoAxesCombined, ListChecks, Cog, Play } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

export const useNavItems = () => {
  const { isDelegated } = useAccount();

  const navItems = [
    { to: "/train", label: "Train", icon: <Play className="w-6 h-6" />, showSubtext: false },
    { to: "/routines", label: "Routines", icon: <ListChecks className="w-6 h-6" />, showSubtext: false },
    { to: "/history", label: "Analysis", icon: <ChartNoAxesCombined className="w-6 h-6" />, showSubtext: false },
    { to: "/account", label: "Account", icon: <Cog className="w-6 h-6" />, disabled: isDelegated, showSubtext: false },
  ];

  return navItems;
};
