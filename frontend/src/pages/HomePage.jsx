import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Button, Spinner } from 'reactstrap';
import MatchCard from '../components/MatchCard';
import HighlightCard from '../components/HighlightCard';
import BottomNavBar from '../components/BottomNavBar';
import TopNavBarToggle from '../components/TopNavBarToggle';
import { useUserContext } from "../context/UserProvider.jsx";

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useUserContext();
    const userId = Number(user?.player_id);

    const [games, setGames] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [activeTab, setActiveTab] = useState('match');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Vamos buscar os jogos, todos os highlights e todos os jogadores
            const [gamesRes, highlightsRes, playersRes, myProfileRes] = await Promise.all([
                axios.get('http://localhost:8000/api/games/'),
                axios.get('http://localhost:8000/api/highlights/'),
                axios.get('http://localhost:8000/api/players/'),
                userId ? axios.get(`http://localhost:8000/api/players/${userId}/`) : null
            ]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activeGames = gamesRes.data.filter(game => {
                const deadline = new Date(game.registration_deadline);
                deadline.setHours(0, 0, 0, 0);
                return deadline >= today;
            });

            setGames(activeGames.reverse());

            const allPlayers = playersRes.data;
            const myFollowingList = myProfileRes?.data?.following || myProfileRes?.data?.colegas || [];

            // Filtramos highlights: os meus ou de quem sigo
            const feedHighlights = highlightsRes.data.filter(h => 
                myFollowingList.includes(h.player) || h.player === userId
            );

            // Adicionamos os dados do autor ao objeto de cada highlight
            const fullFeed = feedHighlights.map(h => {
                const authorData = allPlayers.find(p => p.id === h.player);
                return { ...h, authorFull: authorData };
            });

            setHighlights(fullFeed.reverse());

        } catch (error) {
            console.error("Erro ao carregar dados da Home:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarToggle activeTab={activeTab} setActiveTab={setActiveTab} />

            <Container className="pt-4">
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        {loading ? (
                            <div className="text-center py-5"><Spinner color="danger" /></div>
                        ) : activeTab === 'match' ? (
                            games.length > 0 ? (
                                games.map(game => <MatchCard key={game.id} game={game} />)
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
                            highlights.length > 0 ? (
                                highlights.map(highlight => (
                                    <HighlightCard 
                                        key={highlight.id} 
                                        highlight={highlight} 
                                        author={highlight.authorFull} 
                                    />
                                ))
                            ) : (
                                <div className="text-center py-5 mt-5">
                                    <h4 className="text-muted fw-bold">Ainda não há Highlights</h4>
                                    <p>Segue mais pessoas para veres as suas publicações aqui!</p>
                                </div>
                            )
                        )}
                    </Col>
                </Row>
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default HomePage;