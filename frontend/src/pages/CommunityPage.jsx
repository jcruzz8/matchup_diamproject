import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Input, Button, ListGroup, ListGroupItem, Badge, Row, Col } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import AppAlert from '../components/AppAlert';
import { useUserContext } from "../context/UserProvider.jsx";

const CommunityPage = () => {
    const navigate = useNavigate();

    // Extrai o utilizador do contexto
    const { user } = useUserContext();

    const userId = Number(user?.player_id);

    const [currentUser, setCurrentUser] = useState(null);
    const [followedPlayers, setFollowedPlayers] = useState([]);

    // Estado dos Separadores
    const [activeTab, setActiveTab] = useState('equipas');

    // Estado das Equipas
    const [myTeams, setMyTeams] = useState([]);
    const [suggestedTeams, setSuggestedTeams] = useState([]);
    const [searchedTeams, setSearchedTeams] = useState([]);
    const [searchTeamQuery, setSearchTeamQuery] = useState('');

    // Estado dos Jogadores
    const [searchedPlayers, setSearchedPlayers] = useState([]);
    const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
    const [joinPendingTeams, setJoinPendingTeams] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: '', isOpen: false });

    const showNotification = (message, type) => {
        setNotification({ message, type, isOpen: true });
        setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
    };

    // Carregar os dados iniciais
    useEffect(() => {
        if (userId) {
            fetchInitialData();
        }
    }, [userId]);

    const fetchInitialData = async () => {
        try {
            const resPlayer = await axios.get(`http://localhost:8000/api/players/${userId}/`);
            setCurrentUser(resPlayer.data);
            setFollowedPlayers(resPlayer.data.colegas || []);
            const userZone = resPlayer.data.zone || resPlayer.data.city || '';

            const resTeams = await axios.get(`http://localhost:8000/api/teams/`);
            const allTeams = resTeams.data;

            // Filtrar as minhas equipas
            const minhas = allTeams.filter(t => t.captain === userId || (t.members && t.members.includes(userId)));
            setMyTeams(minhas);

            if (userZone) {
                const sugeridas = allTeams.filter(t =>
                    t.city?.toLowerCase() === userZone.toLowerCase() &&
                    t.captain !== userId &&
                    (!t.members || !t.members.includes(userId))
                );
                setSuggestedTeams(sugeridas.slice(0, 4));
            } else {
                const sugeridas = allTeams.filter(t => t.captain !== userId && (!t.members || !t.members.includes(userId)));
                setSuggestedTeams(sugeridas.slice(0, 4));
            }

        } catch (error) {
            console.error("Erro ao carregar dados da comunidade:", error);
        }
    };

    // Efeito que "ouve" a barra de pesquisa das Equipas
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTeamQuery.trim() !== '') {
                handleSearchTeams();
            } else {
                setSearchedTeams([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTeamQuery]);

    // Efeito que "ouve" a barra de pesquisa dos Jogadores
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchPlayerQuery.trim() !== '') {
                handleSearchPlayers();
            } else {
                setSearchedPlayers([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchPlayerQuery]);

    const handleSearchTeams = async () => {
        try {
            const resTeams = await axios.get(`http://localhost:8000/api/teams/`);
            const results = resTeams.data.filter(t =>
                (t.name || '').toLowerCase().includes(searchTeamQuery.toLowerCase())
            );
            setSearchedTeams(results);
        } catch (error) {
            console.error("Erro na pesquisa de equipas", error);
            showNotification('Erro ao pesquisar equipas.', 'danger');
        }
    };

    const handleSearchPlayers = async () => {
        try {
            const resPlayers = await axios.get(`http://localhost:8000/api/players/`);
            const results = resPlayers.data.filter(p =>
                (p.username || '').toLowerCase().includes(searchPlayerQuery.toLowerCase())
            );
            setSearchedPlayers(results);
        } catch (error) {
            console.error("Erro na pesquisa de jogadores", error);
            showNotification('Erro ao pesquisar jogadores.', 'danger');
        }
    };

    const handleJoinTeam = async (teamId) => {
        try {
            const csrftoken = getCookie('csrftoken');
            const res = await axios.post(`http://localhost:8000/api/teams/${teamId}/join/`, {}, {
                withCredentials: true,
                headers: { 'X-CSRFToken': csrftoken }
            });
            setJoinPendingTeams(prev => [...new Set([...prev, teamId])]);
            showNotification(res.data.message || 'Pedido enviado!', 'success');
        } catch (error) {
            console.error("Erro ao pedir adesão:", error);
            showNotification(error.response?.data?.error || 'Erro ao pedir adesão.', 'danger');
        }
    };
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const handleFollowPlayer = async (targetUserId) => {
        try {
            const csrftoken = getCookie('csrftoken');
            const res = await axios.post(`http://localhost:8000/api/players/${targetUserId}/follow/`, {}, {
                withCredentials: true,
                headers: { 'X-CSRFToken': csrftoken }
            });
            setFollowedPlayers(prev => [...new Set([...prev, targetUserId])]);
            showNotification(res.data.message || 'Ação efetuada', 'success');
        } catch (error) {
            console.error("Erro ao seguir jogador", error);
            showNotification(error.response?.data?.error || 'Erro ao seguir jogador', 'danger');
        }
    };

    const getPic = (obj) => {
        let picUrl = obj.photo || obj.logo || obj.profile_picture;
        if (picUrl && picUrl.startsWith('/')) return `http://localhost:8000${picUrl}`;
        return picUrl;
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />
            <AppAlert {...notification} toggle={() => setNotification(prev => ({ ...prev, isOpen: false }))} />

            <Container className="pt-4 pb-5 mb-5">
                <h3 className="fw-bold mb-4 text-center">Comunidade</h3>

                <div className="d-flex bg-secondary bg-opacity-10 rounded-pill p-1 shadow-sm border mb-4 mx-auto" style={{ maxWidth: '300px' }}>
                    <button
                        className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'equipas' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`}
                        onClick={() => setActiveTab('equipas')}
                    >
                        Equipas
                    </button>
                    <button
                        className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'jogadores' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`}
                        onClick={() => setActiveTab('jogadores')}
                    >
                        Jogadores
                    </button>
                </div>

                {/* Equipas */}
                {activeTab === 'equipas' && (
                    <div>
                        <div className="mb-5">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold m-0">As Minhas Equipas</h5>
                                <Button size="sm" color="danger" outline className="fw-bold rounded-pill" onClick={() => navigate('/criar/equipa')}>+ Criar</Button>
                            </div>

                            {myTeams.length > 0 ? (
                                <Row className="flex-nowrap overflow-auto pb-2 gx-3" style={{ scrollbarWidth: 'none' }}>
                                    {myTeams.map(team => {
                                        let roles = [];
                                        if (team.coach == userId) roles.push("Treinador");
                                        if (team.captain == userId) roles.push("Capitão");

                                        if (roles.length === 0) roles.push("Jogador");

                                        const roleText = roles.join(" & ");
                                        const badgeColor = roles.includes("Treinador") ? "danger" : (roles.includes("Capitão") ? "danger" : "secondary");

                                        return (
                                            <Col xs={8} md={5} key={team.id}>
                                                <div
                                                    className="border border-secondary border-opacity-25 rounded-4 p-3 bg-white shadow-sm text-center h-100 pb-4 position-relative cursor-pointer"
                                                    onClick={() => navigate(`/equipa/${team.id}`)}
                                                >
                                                    <div className="rounded-circle overflow-hidden bg-light mx-auto mb-2 border" style={{ width: '60px', height: '60px' }}>
                                                        {getPic(team) ? <img src={getPic(team)} alt={team.name} className="w-100 h-100 object-fit-cover" /> : <span className="d-flex align-items-center justify-content-center h-100 fw-bold text-muted">EQ</span>}
                                                    </div>
                                                    <h6 className="fw-bold mb-1 text-truncate">{team.name}</h6>
                                                    <small className="text-muted d-block mb-3">{team.modality}</small>

                                                    <div className="position-absolute bottom-0 start-50 translate-middle-x w-100 mb-2">
                                                        <Badge color={badgeColor} className="rounded-pill shadow-sm px-2 text-truncate" style={{ fontSize: '10px', letterSpacing: '0.5px', maxWidth: '90%' }}>
                                                            {roleText}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            ) : (
                                <div className="text-center p-4 bg-white border rounded-4 shadow-sm">
                                    <span className="text-muted small">Ainda não pertences a nenhuma equipa.</span>
                                </div>
                            )}
                        </div>

                        {/* PESQUISA DE EQUIPAS */}
                        <div className="mb-5">
                            <h5 className="fw-bold mb-3">Descobrir Equipas</h5>
                            <div className="mb-3 position-relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                </svg>
                                <Input
                                    type="text"
                                    placeholder="Procurar por equipas..."
                                    className="rounded-pill shadow-sm bg-white ps-5 py-2 border-secondary border-opacity-25"
                                    value={searchTeamQuery}
                                    onChange={(e) => setSearchTeamQuery(e.target.value)}
                                />
                            </div>

                            {searchedTeams.length > 0 && (
                                <ListGroup className="rounded-4 shadow-sm border-0 mb-4">
                                    {searchedTeams.map(team => (
                                        <ListGroupItem key={team.id} className="d-flex justify-content-between align-items-center py-3 border-secondary border-opacity-10">
                                            <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate(`/equipa/${team.id}`)}>
                                                <div className="rounded-circle overflow-hidden bg-light me-3 border" style={{ width: '45px', height: '45px' }}>
                                                    {getPic(team) && <img src={getPic(team)} alt="logo" className="w-100 h-100 object-fit-cover" />}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{team.name}</h6>
                                                    <small className="text-muted">{team.city} • {team.modality}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button size="sm" outline color="dark" className="rounded-pill px-3 shadow-sm" onClick={() => navigate(`/equipa/${team.id}`)}>Ver</Button>
                                                {team.captain == userId || (team.members && team.members.includes(parseInt(userId))) ? (
                                                    <Badge color="secondary" className="p-2 px-3 rounded-pill shadow-sm">A tua Equipa</Badge>
                                                ) : joinPendingTeams.includes(team.id) ? (
                                                    <Button size="sm" color="secondary" className="fw-bold rounded-pill px-3 shadow-sm" disabled>Pendente</Button>
                                                ) : (
                                                    <Button size="sm" color="danger" className="fw-bold rounded-pill px-3 shadow-sm" onClick={() => handleJoinTeam(team.id)}>Pedir</Button>
                                                )}
                                            </div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            )}
                        </div>

                        <div>
                            <h5 className="fw-bold mb-3">Perto de Ti <span className="text-muted small fw-normal">({currentUser?.zone || 'Toda a parte'})</span></h5>
                            {suggestedTeams.length > 0 ? (
                                <ListGroup className="rounded-4 shadow-sm border-0">
                                    {suggestedTeams.map(team => (
                                        <ListGroupItem key={team.id} className="d-flex justify-content-between align-items-center py-3 border-secondary border-opacity-10">
                                            <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate(`/equipa/${team.id}`)}>
                                                <div className="rounded-circle overflow-hidden bg-light me-3 border" style={{ width: '45px', height: '45px' }}>
                                                    {getPic(team) && <img src={getPic(team)} alt="logo" className="w-100 h-100 object-fit-cover" />}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{team.name}</h6>
                                                    <small className="text-muted">{team.modality}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button size="sm" outline color="dark" className="rounded-pill px-3 shadow-sm" onClick={() => navigate(`/equipa/${team.id}`)}>Ver</Button>
                                                {joinPendingTeams.includes(team.id) ? (
                                                    <Button size="sm" color="secondary" className="fw-bold rounded-pill px-3" disabled>Pendente</Button>
                                                ) : (
                                                    <Button size="sm" outline color="danger" className="fw-bold rounded-pill px-3" onClick={() => handleJoinTeam(team.id)}>Aderir</Button>
                                                )}
                                            </div>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p className="text-muted small">Não encontrámos equipas com vagas na tua zona.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Jogadores */}
                {activeTab === 'jogadores' && (
                    <div>
                        <div className="mb-4">
                            <h5 className="fw-bold mb-3">Encontrar Jogadores</h5>
                            <div className="position-relative mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                </svg>
                                <Input
                                    type="text"
                                    placeholder="Procurar por username..."
                                    className="rounded-pill shadow-sm bg-white ps-5 py-2 border-secondary border-opacity-25"
                                    value={searchPlayerQuery}
                                    onChange={(e) => setSearchPlayerQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {searchedPlayers.length > 0 ? (
                            <ListGroup className="rounded-4 shadow-sm border-0">
                                {searchedPlayers.map(player => (
                                    <ListGroupItem key={player.id} className="d-flex justify-content-between align-items-center py-3 border-secondary border-opacity-10">
                                        <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate(`/perfil/${player.id}`)}>
                                            <div className="rounded-circle overflow-hidden bg-secondary me-3 border" style={{ width: '45px', height: '45px' }}>
                                                {getPic(player) && <img src={getPic(player)} alt="user" className="w-100 h-100 object-fit-cover" />}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0">{player.username}</h6>
                                                <small className="text-muted">{player.first_name} {player.last_name}</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button size="sm" outline color="dark" className="rounded-pill px-3 shadow-sm" onClick={() => navigate(`/perfil/${player.id}`)}>Ver</Button>
                                            {player.id == userId ? (
                                                <Badge color="dark" className="p-2 px-3 rounded-pill shadow-sm">Tu</Badge>
                                            ) : currentUser?.colegas?.includes(player.id) ? (
                                                <Badge color="success" className="p-2 px-3 rounded-pill shadow-sm">Colega</Badge>
                                            ) : followedPlayers.includes(player.id) ? (
                                                <Button size="sm" color="secondary" className="fw-bold rounded-pill px-3 shadow-sm" disabled>Seguindo</Button>
                                            ) : (
                                                <Button size="sm" color="danger" className="fw-bold rounded-pill px-3 shadow-sm" onClick={() => handleFollowPlayer(player.id)}>Seguir</Button>
                                            )}
                                        </div>
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        ) : (
                            searchPlayerQuery && <p className="text-center text-muted mt-4">Nenhum jogador encontrado.</p>
                        )}

                        {!searchPlayerQuery && searchedPlayers.length === 0 && (
                            <div className="text-center py-5 mt-4 border rounded-4 bg-white shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-secondary mb-3 opacity-50" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>
                                <h6 className="fw-bold text-muted">Pesquisa os teus amigos</h6>
                                <p className="text-muted small px-4">Procura pelo username para começarem a seguir-se e organizar grandes jogos.</p>
                            </div>
                        )}
                    </div>
                )}
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default CommunityPage;