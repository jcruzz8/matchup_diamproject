import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Input, Button, ListGroup, ListGroupItem, Badge, Row, Col } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';

const CommunityPage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('matchup_user_id');
    const [currentUser, setCurrentUser] = useState(null);

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

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }
        fetchInitialData();
    }, [userId, navigate]);

    const fetchInitialData = async () => {
        try {
            const resPlayer = await axios.get(`http://127.0.0.1:8000/api/players/${userId}/`);
            setCurrentUser(resPlayer.data);
            const userZone = resPlayer.data.zone || resPlayer.data.city || '';

            const resTeams = await axios.get(`http://127.0.0.1:8000/api/teams/`);
            const allTeams = resTeams.data;

            const minhas = allTeams.filter(t => t.captain == userId || (t.members && t.members.includes(parseInt(userId))));
            setMyTeams(minhas);

            if (userZone) {
                const sugeridas = allTeams.filter(t => 
                    t.city?.toLowerCase() === userZone.toLowerCase() && 
                    t.captain != userId && 
                    (!t.members || !t.members.includes(parseInt(userId)))
                );
                setSuggestedTeams(sugeridas.slice(0, 4));
            } else {
                const sugeridas = allTeams.filter(t => t.captain != userId && (!t.members || !t.members.includes(parseInt(userId))));
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
                setSearchedTeams([]); // Limpa os resultados se apagar o texto
            }
        }, 300); // Espera 300ms após parares de escrever

        return () => clearTimeout(delayDebounceFn);
    }, [searchTeamQuery]);

    // Efeito que "ouve" a barra de pesquisa dos Jogadores
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchPlayerQuery.trim() !== '') {
                handleSearchPlayers();
            } else {
                setSearchedPlayers([]); // Limpa os resultados se apagar o texto
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchPlayerQuery]);

    const handleSearchTeams = async () => {
        try {
            const resTeams = await axios.get(`http://127.0.0.1:8000/api/teams/`);
            const results = resTeams.data.filter(t => 
                t.name.toLowerCase().includes(searchTeamQuery.toLowerCase())
            );
            setSearchedTeams(results);
        } catch (error) {
            console.error("Erro na pesquisa de equipas", error);
        }
    };

    const handleSearchPlayers = async () => {
        try {
            const resPlayers = await axios.get(`http://127.0.0.1:8000/api/players/`);
            const results = resPlayers.data.filter(p => 
                p.username.toLowerCase().includes(searchPlayerQuery.toLowerCase())
            );
            setSearchedPlayers(results);
        } catch (error) {
            console.error("Erro na pesquisa de jogadores", error);
        }
    };

    const handleJoinTeam = async (teamId) => {
        try {
            alert("Pedido enviado ao Capitão da equipa!");
        } catch (error) {
            console.error("Erro ao pedir para aderir", error);
        }
    };

    const handleFollowPlayer = async (targetUserId) => {
        try {
            alert("Pedido para seguir enviado!");
        } catch (error) {
            console.error("Erro ao seguir jogador", error);
        }
    };

    const getPic = (obj) => {
        let picUrl = obj.photo || obj.logo || obj.profile_picture;
        if (picUrl && picUrl.startsWith('/')) return `http://127.0.0.1:8000${picUrl}`;
        return picUrl;
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

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
                                    {myTeams.map(team => (
                                        <Col xs={8} md={5} key={team.id}>
                                            <div className="border border-secondary border-opacity-25 rounded-4 p-3 bg-white shadow-sm text-center h-100">
                                                <div className="rounded-circle overflow-hidden bg-light mx-auto mb-2 border" style={{ width: '60px', height: '60px' }}>
                                                    {getPic(team) ? <img src={getPic(team)} alt={team.name} className="w-100 h-100 object-fit-cover"/> : <span className="d-flex align-items-center justify-content-center h-100 fw-bold text-muted">EQ</span>}
                                                </div>
                                                <h6 className="fw-bold mb-1 text-truncate">{team.name}</h6>
                                                <small className="text-muted d-block mb-2">{team.modality}</small>
                                                <Badge color={team.captain == userId ? "danger" : "secondary"}>
                                                    {team.captain == userId ? "Capitão" : "Membro"}
                                                </Badge>
                                            </div>
                                        </Col>
                                    ))}
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
                                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
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
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle overflow-hidden bg-light me-3 border" style={{ width: '45px', height: '45px' }}>
                                                    {getPic(team) && <img src={getPic(team)} alt="logo" className="w-100 h-100 object-fit-cover"/>}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{team.name}</h6>
                                                    <small className="text-muted">{team.city} • {team.modality}</small>
                                                </div>
                                            </div>
                                            {team.captain == userId || (team.members && team.members.includes(parseInt(userId))) ? (
                                                <Badge color="secondary" className="p-2 px-3 rounded-pill shadow-sm">A tua Equipa</Badge>
                                            ) : (
                                                <Button size="sm" color="danger" className="fw-bold rounded-pill px-3 shadow-sm" onClick={() => handleJoinTeam(team.id)}>Pedir</Button>
                                            )}
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
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle overflow-hidden bg-light me-3 border" style={{ width: '45px', height: '45px' }}>
                                                    {getPic(team) && <img src={getPic(team)} alt="logo" className="w-100 h-100 object-fit-cover"/>}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{team.name}</h6>
                                                    <small className="text-muted">{team.modality}</small>
                                                </div>
                                            </div>
                                            <Button size="sm" outline color="danger" className="fw-bold rounded-pill px-3" onClick={() => handleJoinTeam(team.id)}>Aderir</Button>
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
                                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
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
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle overflow-hidden bg-secondary me-3 border" style={{ width: '45px', height: '45px' }}>
                                                {getPic(player) && <img src={getPic(player)} alt="user" className="w-100 h-100 object-fit-cover"/>}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0">{player.username}</h6>
                                                <small className="text-muted">{player.name}</small>
                                            </div>
                                        </div>
                                        {player.id == userId ? (
                                            <Badge color="dark" className="p-2 px-3 rounded-pill shadow-sm">Tu</Badge>
                                        ) : currentUser?.colegas?.includes(player.id) ? (
                                            <Badge color="success" className="p-2 px-3 rounded-pill shadow-sm">Colega</Badge>
                                        ) : (
                                            <Button size="sm" color="danger" className="fw-bold rounded-pill px-3 shadow-sm" onClick={() => handleFollowPlayer(player.id)}>Seguir</Button>
                                        )}
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        ) : (
                            searchPlayerQuery && <p className="text-center text-muted mt-4">Nenhum jogador encontrado.</p>
                        )}
                        
                        {!searchPlayerQuery && searchedPlayers.length === 0 && (
                            <div className="text-center py-5 mt-4 border rounded-4 bg-white shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-secondary mb-3 opacity-50" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg>
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