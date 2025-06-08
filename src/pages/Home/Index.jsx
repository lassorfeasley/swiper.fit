// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=107-1611&t=3oXUhbg9QEWAH2mC-4


import AppHeader from '../../components/layout/AppHeader';
import MainContainer from '../../components/common/MainContainer';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    <>
      <AppHeader
        appHeaderTitle="Home"
        showActionBar={false}
        showActionIcon={false}
        showBackButton={false}
        subhead={false}
        search={false}
        data-component="AppHeader"
      />
      <MainContainer data-component="HomePage">
        <div className="max-w-xl mx-auto mt-8 flex flex-col gap-4">
          <Alert>
            <AlertTitle>You are logged in as {email}</AlertTitle>
          </Alert>
          <Button onClick={handleLogout} variant="destructive">Log out</Button>
        </div>
        Home Page
      </MainContainer>
    </>
  );
};

export default Home; 