import React from "react";
import { ArrowRight } from "lucide-react";

interface AccountSettingsMenuProps {
  activeSection?: string;
  onSectionChange: (section: string) => void;
  onDeleteAccount?: () => void;
}

const AccountSettingsMenu: React.FC<AccountSettingsMenuProps> = ({
  onSectionChange,
  onDeleteAccount,
}) => {
  const menuItems = [
    { key: "sharing-requests", label: "Sharing requests" },
    { key: "trainers", label: "My trainers" },
    { key: "clients", label: "My clients" },
    { key: "personal-info", label: "Personal info" },
    { key: "email-password", label: "Email and password" },
    { key: "delete-account", label: "Delete account", isAction: true },
  ];

  return (
    <div className="w-full max-w-[500px] bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
      {menuItems.map((item, index) => (
        <div
          key={item.key}
          data-layer="selections"
          data-property-1="labeled-icon"
          className={`InputWrapper self-stretch h-14 p-3 ${
            index % 2 === 1 ? "bg-neutral-Neutral-50" : "bg-white"
          } inline-flex justify-center items-center cursor-pointer`}
          onClick={() => {
            if (item.key === 'delete-account' && onDeleteAccount) {
              onDeleteAccount();
            } else {
              onSectionChange(item.key);
            }
          }}
        >
          <div className="Frame75 flex-1 flex justify-start items-center gap-5">
            <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
              <div className="Text self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                {item.label}
              </div>
            </div>
          </div>
          <div className="LucideIcon w-6 h-6 flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-neutral-neutral-500" strokeWidth={2} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountSettingsMenu;

