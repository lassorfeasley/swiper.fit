// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=107-1611

import AppLayout from "@/components/layout/AppLayout";

const Home = () => {
  return (
    <AppLayout
      hideHeader={true}
      reserveSpace={false}
      showAddButton={false}
      showBackButton={false}
      search={false}
      pageContext="default"
    >
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-600 mb-4">Dashboard</h1>
          <p className="text-neutral-700">Welcome to SwiperFit</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
