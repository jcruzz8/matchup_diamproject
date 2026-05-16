import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Badge } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import MatchCard from '../components/MatchCard';
import {useUserContext} from "../context/UserProvider.jsx";

const MatchStatusPage = () => {
const navigate = useNavigate();
    const [myRequests, setMyRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('APPROVED');

    // 2. Extrair o utilizador do contexto (adeus localStorage!)
    const { user } = useUserContext();

    // Garantir que o ID é um número seguro
    const userId = Number(user?.player_id);

    // 3. useEffect super limpo: já não precisamos do navigate('/login') aqui!
    useEffect(() => {
        if (userId) {
            fetchMyStatuses();
        }
    }, [userId]);

    const fetchMyStatuses = async () => {
        try {
            const resRegs = await axios.get(`http://localhost:8000/api/registrations/`);

            // 4. Como userId agora é um Number garantido, podemos usar '==='
            const userRegs = resRegs.data.filter(reg => reg.player === userId);

            const resGames = await axios.get(`http://localhost:8000/api/games/`);

            // Ordena os pedidos do mais recente (maior ID) para o mais antigo
            userRegs.sort((a, b) => b.id - a.id);

            const seenGames = new Set();
            const uniqueRequests = [];

            // Guarda apenas o pedido mais recente para cada Jogo
            for (const reg of userRegs) {
                if (!seenGames.has(reg.game)) {
                    seenGames.add(reg.game);
                    // Aqui mantemos '==' ou convertemos g.id para Number se necessário
                    const gameInfo = resGames.data.find(g => Number(g.id) === Number(reg.game));
                    if (gameInfo) {
                        uniqueRequests.push({ ...reg, gameDetails: gameInfo });
                    }
                }
            }

            setMyRequests(uniqueRequests);
        } catch (error) {
            console.error("Erro ao carregar o estado dos jogos:", error);
        }
    };

    // Filtra os pedidos com base no separador selecionado
    const filteredRequests = myRequests.filter(request => request.status === activeTab);

    return (
        <div className="bg-light min-vh-100 pb-5">
            
            <TopNavBarSimple showBack={true} />

            <Container className="pt-4 pb-5 mb-4">
                <h4 className="fw-bold mb-4 text-center">Estado das Inscrições</h4>

                {/* MENU DE SEPARADORES */}
                <div className="d-flex bg-secondary bg-opacity-10 rounded-pill p-1 shadow-sm border mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                    <button 
                        className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'APPROVED' ? 'bg-white shadow-sm text-success' : 'text-muted border-0 bg-transparent'}`}
                        onClick={() => setActiveTab('APPROVED')}
                    >
                        Confirmados
                    </button>
                    <button 
                        className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'PENDING' ? 'bg-white shadow-sm text-warning' : 'text-muted border-0 bg-transparent'}`}
                        onClick={() => setActiveTab('PENDING')}
                    >
                        Pendentes
                    </button>
                    <button 
                        className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'REJECTED' ? 'bg-white shadow-sm text-danger' : 'text-muted border-0 bg-transparent'}`}
                        onClick={() => setActiveTab('REJECTED')}
                    >
                        Rejeitados
                    </button>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="text-center py-5 mt-4">
                        <h5 className="text-muted fw-bold">
                            {activeTab === 'APPROVED' && "Ainda não tens jogos confirmados."}
                            {activeTab === 'PENDING' && "Não tens nenhum pedido pendente."}
                            {activeTab === 'REJECTED' && "Boas notícias! Não tens pedidos rejeitados."}
                        </h5>
                        <button className="btn btn-danger mt-3 rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate('/')}>Procurar Match</button>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request.id} className="mb-4">
                            {/* A BARRA DE ESTADO ANTES DO CARTÃO */}
                            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                                <span className="fw-bold text-secondary small text-uppercase">
                                    Pedido: {request.position_id === 'auto' ? 'Auto-Balanceamento' : request.position_id} {request.team ? '(Equipa)' : ''}
                                </span>
                                
                                {request.status === 'PENDING' && <Badge color="warning" className="text-dark p-2 shadow-sm px-3">Pendente ⏳</Badge>}
                                {request.status === 'APPROVED' && <Badge color="success" className="p-2 shadow-sm px-3">Confirmado ✅</Badge>}
                                {request.status === 'REJECTED' && <Badge color="secondary" className="p-2 shadow-sm px-3 text-decoration-line-through">Rejeitado ❌</Badge>}
                            </div>
                            
                            <MatchCard game={request.gameDetails} userRegistrationStatus={request.status} />
                        </div>
                    ))
                )}
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default MatchStatusPage;