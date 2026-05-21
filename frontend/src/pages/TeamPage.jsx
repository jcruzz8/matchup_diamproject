import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Button, Badge, ListGroup, ListGroupItem, Spinner } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import AppAlert from '../components/AppAlert';
import { useUserContext } from "../context/UserProvider.jsx";

const TeamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserContext();
    const userId = Number(user?.player_id);

    const [team, setTeam] = useState(null);
    const [membersList, setMembersList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Controlo de Pedidos de Adesão à Equipa
    const [joinStatus, setJoinStatus] = useState('NONE'); // Pode ser: NONE, PENDING, MEMBER
    const [notification, setNotification] = useState({ message: '', type: '', isOpen: false });

    const showNotification = (message, type) => {
        setNotification({ message, type, isOpen: true });
        setTimeout(() => setNotification({ ...notification, isOpen: false }), 3000);
    };

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                // Buscamos a info da equipa e o nosso status para com ESTA equipa
                const [teamRes, playersRes, statusRes] = await Promise.all([
                    axios.get(`http://localhost:8000/api/teams/${id}/`),
                    axios.get('http://localhost:8000/api/players/'),
                    axios.get(`http://localhost:8000/api/teams/${id}/request-status/`, { withCredentials: true }).catch(() => ({ data: { status: 'NONE' } })) // Fallback se a rota não existir
                ]);

                const teamData = teamRes.data;
                const allPlayers = playersRes.data;

                setTeam(teamData);
                setJoinStatus(statusRes.data.status); // Guarda o estado

                const teamMembers = playersRes.data.filter(p =>
                    teamRes.data.members.includes(p.id) ||
                    teamRes.data.captain === p.id ||
                    teamRes.data.coach === p.id
                ).map(p => {
                    let role = 'Jogador'; let roleColor = 'secondary'; let roleOrder = 3;
                    if (p.id === teamRes.data.coach) { role = 'Treinador'; roleColor = 'dark'; roleOrder = 1; }
                    else if (p.id === teamRes.data.captain) { role = 'Capitão'; roleColor = 'danger'; roleOrder = 2; }
                    return { ...p, role, roleColor, roleOrder };
                });

                teamMembers.sort((a, b) => a.roleOrder - b.roleOrder);
                setMembersList(teamMembers);

            } catch (error) {
                console.error("Erro ao carregar equipa:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamDetails();
    }, [id]);

    const isMember = team ? (team.captain === userId || team.members?.includes(userId)) : false;

    const handleJoinRequest = async () => {
        try {
            const res = await axios.post(`http://localhost:8000/api/teams/${id}/join/`, {}, {
                withCredentials: true,
                headers: { 'X-CSRFToken': getCSRFToken() }
            });

            setJoinStatus(res.data.status);
            showNotification(res.data.message, "success");
        } catch (error) {
            console.error("Erro no Pedido:", error);
            if (error.response?.data?.error) {
                showNotification(error.response.data.error, "danger");
            } else {
                showNotification("Não foi possível enviar o pedido.", "danger");
            }
        }
    };
    
    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    }

    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
                <Spinner color="danger" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-light p-4 text-center">
                <h4 className="fw-bold text-dark">Equipa não encontrada</h4>
                <Button color="danger" outline className="mt-3 rounded-pill" onClick={() => navigate(-1)}>Voltar atrás</Button>
            </div>
        );
    }

    const getPic = (pic) => pic ? (pic.startsWith('/') ? `http://localhost:8000${pic}` : pic) : null;

    return (
        <div className="bg-light min-vh-100 pb-5" style={{ paddingTop: '56px' }}>

            {/* TopBar Fixa */}
            <div className="fixed-top w-100" style={{ zIndex: 1050 }}>
                <TopNavBarSimple />
                {/* ALERTA INCORPORADO AQUI */}
                <AppAlert {...notification} toggle={() => setNotification({ ...notification, isOpen: false })} />
            </div>

            <Container className="pt-4 pb-5 mb-5">

                {/* Botão de Voltar */}
                <Button color="link" className="text-dark text-decoration-none p-0 mb-3 d-flex align-items-center fw-bold" onClick={() => navigate(-1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                    </svg>
                    Voltar
                </Button>

                {/* INFORMAÇÃO PRINCIPAL DA EQUIPA */}
                <div className="bg-white rounded-4 shadow-sm p-4 mb-4 text-center position-relative">
                    <div
                        className="rounded-circle overflow-hidden bg-secondary border border-3 border-white shadow-sm mx-auto mb-3"
                        style={{ width: '100px', height: '100px', marginTop: '-10px' }}
                    >
                        {getPic(team.logo) ? (
                            <img src={getPic(team.logo)} alt={team.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white fw-bold fs-2">
                                {team.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h3 className="fw-bold text-dark mb-1">{team.name}</h3>
                    <div className="d-flex justify-content-center gap-2 mb-3">
                        <Badge color="danger" className="px-3 py-2 rounded-pill shadow-sm">{team.modality}</Badge>
                        {team.city && <Badge color="secondary" className="px-3 py-2 rounded-pill shadow-sm bg-opacity-75">{team.city}</Badge>}
                    </div>

                    <p className="text-muted small px-3 mb-4">
                        {team.description || "Esta equipa ainda não adicionou uma descrição. Mas estão prontos para entrar em campo!"}
                    </p>

                    {/* BOTÕES DE EQUIPA */}
                    {isMember ? (
                        <Button
                        color="dark"
                        className="rounded-pill fw-bold px-4 w-100 py-2 shadow-sm"
                        onClick={() => navigate('/mensagens', {
                            state: {
                                openChat: {
                                    id: Number(id),
                                    isTeam: true,
                                    username: team?.name,
                                    name: team?.name,
                                    avatar: team?.logo
                                }
                            }
                        })}
                    >
                            Ir para o Chat da Equipa 💬
                        </Button>
                    ) : (
                        <Button
                            color={joinStatus === 'PENDING' ? "secondary" : "danger"}
                            disabled={joinStatus === 'PENDING'}
                            className="rounded-pill fw-bold px-4 w-100 py-2 shadow-sm"
                            onClick={handleJoinRequest}
                        >
                            {joinStatus === 'PENDING' ? 'Pedido Pendente ⏳' : 'Pedir para Entrar na Equipa ➕'}
                        </Button>
                    )}
                </div>

                {/* LISTA DE MEMBROS (PLANTEL) */}
                <h5 className="fw-bold text-dark mb-3 px-1">Plantel ({membersList.length})</h5>

                <div className="bg-white rounded-4 shadow-sm overflow-hidden">
                    <ListGroup flush>
                        {membersList.map(member => (
                            <ListGroupItem
                                key={member.id}
                                action
                                tag="button"
                                onClick={() => navigate(`/perfil/${member.id}`)}
                                className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-10"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle overflow-hidden bg-light border me-3" style={{ width: '45px', height: '45px' }}>
                                        {getPic(member.photo) ? (
                                            <img src={getPic(member.photo)} alt="user" className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex justify-content-center align-items-center text-secondary fw-bold">
                                                {member.username.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>
                                            {member.first_name} {member.last_name}
                                            {member.id === userId && <span className="text-muted ms-1 fw-normal">(Tu)</span>}
                                        </h6>
                                        <small className="text-muted" style={{ fontSize: '11px' }}>@{member.username}</small>
                                    </div>
                                </div>
                                <Badge color={member.roleColor} className="rounded-pill px-2 py-1 shadow-sm" style={{ fontSize: '10px' }}>
                                    {member.role}
                                </Badge>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default TeamPage;