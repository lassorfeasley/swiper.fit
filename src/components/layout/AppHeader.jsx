import React from "react";

export const AppHeader = ({
  title = "Page Title",
  onBack,
  onEdit,
  onAction,
  showBack = false,
  showEdit = false,
  action_bar,
}) => {
  return (
    <header className="flex flex-col w-full items-start relative">
      <nav className="flex flex-col items-start gap-2 pt-10 pb-5 px-5 relative self-stretch w-full flex-[0_0_auto] bg-white border-b border-black">
        <div className="flex items-center relative self-stretch w-full flex-[0_0_auto]">
          {showBack && (
            <button
              className="p-0 bg-transparent border-none cursor-pointer mr-4"
              aria-label="Go back"
              onClick={onBack}
            >
              <span className="material-icons w-6 h-6">arrow_back</span>
            </button>
          )}
          <h1 className="flex-1 text-2xl font-bold text-black">
            {title}
          </h1>
          {showEdit && (
            <button
              className="p-0 bg-transparent border-none cursor-pointer ml-4"
              aria-label="Edit title"
              onClick={onEdit}
            >
              <span className="material-icons w-6 h-6">edit</span>
            </button>
          )}
          {onAction && !showEdit && (
            <button
              className="p-0 bg-transparent border-none cursor-pointer ml-4"
              aria-label="Action"
              onClick={onAction}
            >
              <span className="material-icons w-6 h-6">add</span>
            </button>
          )}
        </div>
      </nav>
      {action_bar && (
        <div className="w-full bg-[#353942]">
          {action_bar}
        </div>
      )}
    </header>
  );
};

export default AppHeader; 