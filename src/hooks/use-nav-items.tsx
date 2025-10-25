import { ChartNoAxesCombined, ListChecks, Cog, Play } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { ReactElement } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactElement;
  showSubtext: boolean;
  subtext?: string;
  disabled?: boolean;
}

export const useNavItems = (): NavItem[] => {
  const { isDelegated } = useAccount();

  const navItems: NavItem[] = [
    { to: "/train", label: "Train", icon: <Play className="w-6 h-6" />, showSubtext: false },
    { to: "/routines", label: "Routines", icon: <ListChecks className="w-6 h-6" />, showSubtext: false, disabled: isDelegated },
    { to: "/history", label: "Analysis", icon: <ChartNoAxesCombined className="w-6 h-6" />, showSubtext: false },
    { to: "/account", label: "Account", icon: <Cog className="w-6 h-6" />, disabled: isDelegated, showSubtext: false },
  ];

  return navItems;
};
