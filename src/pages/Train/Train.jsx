import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainContentSection from "@/components/layout/MainContentSection";

const Train = () => {
  return (
    <AppLayout
      reserveSpace={false}
      variant="glass"
      title="Train"
      showSidebar={true}
      showShare={false}
      showBackButton={false}
      search={false}
      pageContext="train"
    >
      <MainContentSection className="!p-0 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
          <h1 className="text-2xl font-bold text-neutral-700 mb-4">Train</h1>
          <p className="text-neutral-500">Training page coming soon...</p>
        </div>
      </MainContentSection>
    </AppLayout>
  );
};

export default Train;
