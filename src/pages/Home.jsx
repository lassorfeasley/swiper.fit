// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=107-1611&t=3oXUhbg9QEWAH2mC-4


import AppHeader from '../components/layout/AppHeader';
import MainContainer from '../components/common/MainContainer';

const Home = () => (
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
      Home Page
    </MainContainer>
  </>
);

export default Home; 