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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/organizar" element={<OrganizerDashboard />} />
        <Route path="/criar" element={<CreateMenuPage />} /> 
        <Route path="/criar/jogo" element={<CreateGamePage />} />
        <Route path="/criar/equipa" element={<CreateTeamPage />} />
        <Route path="/estado-match" element={<MatchStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;