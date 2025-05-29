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