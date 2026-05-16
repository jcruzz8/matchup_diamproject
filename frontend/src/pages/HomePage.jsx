import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Button } from 'reactstrap';
import MatchCard from '../components/MatchCard';
import BottomNavBar from '../components/BottomNavBar';
import TopNavBarToggle from '../components/TopNavBarToggle';

const HomePage = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState([]); // Estado para guardar os jogos reais
    const [activeTab, setActiveTab] = useState('match'); // Controla o que vemos (Match's ou Highlights)

    // Função para ir buscar os jogos ao Django
    const fetchGames = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/games/');
            // Inverter a ordem para os jogos mais recentes aparecerem primeiro
            setGames(response.data.reverse());
        } catch (error) {
            console.error("Erro ao carregar os jogos:", error);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    return (
        <div className="bg-light min-vh-100 pb-5">

            <TopNavBarToggle activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* FEED DE MATCHES OU HIGHLIGHTS */}
            <Container className="pt-4">
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        {activeTab === 'match' ? (
                            games.length > 0 ? (
                                games.map(game => (
                                    <MatchCard key={game.id} game={game} />
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <h4 className="text-muted fw-bold">Sem Matches na tua zona</h4>
                                    <p>Sê o primeiro a agendar um jogo e convida a malta!</p>
                                    <Button color="danger" className="mt-3 fw-bold px-4 rounded-pill" onClick={() => navigate('/criar')}>
                                        Criar Match Agora
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-5 mt-5">
                                <h4 className="text-muted fw-bold">Ainda não há Highlights</h4>
                                <p>Segue mais pessoas para veres as suas publicações aqui!</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default HomePage;