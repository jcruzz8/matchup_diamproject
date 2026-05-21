import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CreateMenuPage from './pages/CreateMenuPage';
import CreateGamePage from './pages/CreateGamePage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import MatchStatusPage from './pages/MatchStatusPage';
import CreateTeamPage from './pages/CreateTeamPage';
import CommunityPage from './pages/CommunityPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import {useUserContext} from "./context/UserProvider.jsx";
import MessagesPage from './pages/MessagesPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import FinancePage from './pages/FinancePage.jsx';

function App() {

  const { user } = useUserContext();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user?<HomePage/>:<LandingPage/>}/>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/organizar" element={<OrganizerDashboard />} />
        <Route path="/criar" element={<CreateMenuPage />} />
        <Route path="/criar/jogo" element={<CreateGamePage />} />
        <Route path="/criar/equipa" element={<CreateTeamPage />} />
        <Route path="/criar/publicacao" element={<CreatePostPage />} />
        <Route path="/estado-match" element={<MatchStatusPage />} />
        <Route path="/comunidade" element={<CommunityPage />} />
        <Route path="/pesquisar" element={<SearchPage />} />
        <Route path="/perfil" element={user?<ProfilePage/>:<LandingPage/>} />
        <Route path="/perfil/:id" element={user ? <PublicProfilePage/> : <LandingPage/>} />
        <Route path="/editar-perfil" element={user?<EditProfilePage/>:<LandingPage/>} />
        <Route path="/mensagens" element={user?<MessagesPage/>:<LandingPage/>} />
        <Route path="/financas" element={user ? <FinancePage /> : <LandingPage />} />
        <Route path="/equipa/:id" element={user ? <TeamPage /> : <LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;