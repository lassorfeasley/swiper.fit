// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=107-1611

import AppLayout from "@/components/layout/AppLayout";
import { Alert, AlertTitle } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

const Home = () => {
  const { user } = useAuth();
  const email = user?.email || "Unknown";
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  return (
    <AppLayout
      reserveSpace={true}
      title="Home"
      showAddButton={false}
      showBackButton={false}
      search={false}
      pageContext="default"
    >
      <div className="max-w-xl mx-auto mt-8 flex flex-col gap-4">
        <Alert>
          <AlertTitle>You are logged in as {email}</AlertTitle>
        </Alert>
        <Button onClick={handleLogout} variant="destructive">
          Log out
        </Button>
      </div>
    </AppLayout>
  );
};

export default Home;
