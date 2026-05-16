import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, CardBody, Button, Badge, Input } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import {useUserContext} from "../context/UserProvider.jsx";

const ProfilePage = () => {
    const navigate = useNavigate();

    // 1. Lemos o ID do URL (se estivermos a ver o perfil de outra pessoa)
    const { id } = useParams();

    // 2. Trazemos o utilizador global do Contexto (em vez do localStorage)
    const { user } = useUserContext();

    // 3. MATEMÁTICA DE IDs (Segurança de Tipos)
    // Se vier um ID no URL, usamos esse. Se não vier, mostramos o perfil do utilizador que fez login.
    const profileId = id ? Number(id) : user?.player_id;

    // O botão "Editar Perfil" só aparece se o perfil que estamos a ver for o nosso!
    const isMyProfile = profileId === Number(user?.player_id);

    const [profile, setProfile] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [userPhotos, setUserPhotos] = useState([]);

    // Controlo de UI
    const [activeTab, setActiveTab] = useState('photos');
    const [selectedModality, setSelectedModality] = useState('Geral');

    useEffect(() => {
        if (profileId) { // Só carrega os dados se já tivermos a certeza de qual é o ID
            fetchProfileData();
            fetchUserTeams();
            fetchUserPhotos();
        }
    }, [profileId]); // Executa sempre que mudares de um perfil para outro

    const fetchProfileData = async () => {
        try {
            // Alterado de user.player.id para profileId (dinâmico)
            const res = await axios.get(`http://localhost:8000/api/players/${profileId}/`);
            setProfile(res.data);

            if (res.data.sport_positions && Object.keys(res.data.sport_positions).length > 0) {
                setSelectedModality(Object.keys(res.data.sport_positions)[0]);
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
        }
    };

    const fetchUserTeams = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/teams/`);
            // Alterado para usar o profileId dinâmico
            const myTeams = res.data.filter(t => t.captain == profileId || (t.members && t.members.includes(profileId)));
            setUserTeams(myTeams);
        } catch (error) {
            console.error("Erro ao carregar equipas:", error);
        }
    };

    const fetchUserPhotos = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/highlights/`);
            // Alterado para usar o profileId dinâmico
            const myPhotos = res.data.filter(photo => photo.player == profileId);
            setUserPhotos(myPhotos.reverse());
        } catch {
            console.log("Sem fotos ou endpoint não criado ainda.");
        }
    };

    const getPic = (obj) => {
        if (!obj) return null;
        let picUrl = obj.photo || obj.image || obj.profile_picture || obj.logo;
        if (picUrl && picUrl.startsWith('/')) return `http://localhost:8000${picUrl}`;
        return picUrl;
    };

    if (!profile) return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple showBack={true} />
            <div className="text-center mt-5 pt-5 text-muted fw-bold">A carregar Craque...</div>
            <BottomNavBar />
        </div>
    );
    
    // Procura as stats específicas da modalidade. Se não existirem, usa as globais (fallback)
    let currentStats = {
        matches_played: profile.matches_played || 0,
        wins: profile.wins || 0,
        draws: profile.draws || 0,
        losses: profile.losses || 0,
        goals: profile.goals || 0,
        assists: profile.assists || 0
    };

    if (selectedModality !== 'Geral' && profile.modality_stats && profile.modality_stats[selectedModality]) {
        currentStats = profile.modality_stats[selectedModality];
    }

    const winRate = currentStats.matches_played > 0 ? Math.round((currentStats.wins / currentStats.matches_played) * 100) : 0;
    
    // Descobre a posição na modalidade selecionada
    const currentPosition = profile.sport_positions ? profile.sport_positions[selectedModality] : 'Não definida';

    // Lista de modalidades para o Dropdown
    const availableModalities = profile.sport_positions ? Object.keys(profile.sport_positions) : [];

    // Calcula idade
    const calculateAge = (dob) => {
        if (!dob) return '';
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs); 
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

            {/* ZONA DE CAPA E FOTO */}
            <div className="position-relative bg-dark" style={{ height: '140px', background: 'linear-gradient(45deg, #212529, #dc3545)' }}></div>

            <Container className="pb-5 mb-5" style={{ marginTop: '-60px' }}>
                <Card className="shadow-sm border-0 rounded-4 mb-4">
                    <CardBody className="p-4 text-center">
                        
                        <div className="rounded-circle overflow-hidden bg-white mx-auto border border-4 border-white shadow-sm position-relative mb-3" style={{ width: '120px', height: '120px', backgroundColor: '#f8f9fa' }}>
                            {getPic(profile) ? (
                                <img src={getPic(profile)} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div className="w-100 h-100 d-flex justify-content-center align-items-center bg-secondary text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
                                </div>
                            )}
                        </div>

                        <h4 className="fw-bold mb-0 text-dark">{profile.first_name} {profile.last_name}</h4>
                        <div className="text-muted fw-semibold mb-3">@{profile.username}</div>
                        
                        <div className="d-flex justify-content-center gap-3 mb-4 text-muted small fw-bold">
                            {profile.zone && <span>{profile.zone}</span>}
                            <span>{profile.birth_date ? calculateAge(profile.birth_date) + ' anos' : 'Idade não definida'}</span>
                            {profile.height && <span> {profile.height}cm</span>}
                        </div>

                        <div className="d-flex justify-content-center gap-4 mb-4">
                            <div className="text-center">
                                <h5 className="fw-bold m-0 text-dark">{profile.followers_count || 0}</h5>
                                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '10px' }}>Seguidores</small>
                            </div>
                            <div className="border-end border-secondary border-opacity-25"></div>
                            <div className="text-center">
                                <h5 className="fw-bold m-0 text-dark">{profile.following_count || 0}</h5>
                                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '10px' }}>A Seguir</small>
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        {isMyProfile ? (
                            <Button outline color="danger" className="rounded-pill fw-bold px-4 w-100 shadow-sm border-2" onClick={() => navigate('/editar-perfil')}>
                                Editar Perfil
                            </Button>
                        ) : (
                            <Button color="danger" className="rounded-pill fw-bold px-4 w-100 shadow-sm border-2">
                                Seguir
                            </Button>
                        )}
                    </CardBody>
                </Card>

                {/* TABS DE NAVEGAÇÃO DO PERFIL */}
                <div className="d-flex bg-white rounded-pill p-1 shadow-sm border mb-4">
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'stats' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('stats')}>
                        Stats
                    </button>
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'photos' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('photos')}>
                        Highlights
                    </button>
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'teams' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('teams')}>
                        Equipas
                    </button>
                </div>

                {/* HighLights */}
                {activeTab === 'photos' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                            <h6 className="fw-bold m-0 text-dark">Highlights</h6>
                            {isMyProfile && <Button size="sm" color="danger" outline className="rounded-pill fw-bold px-3">+ Publicar</Button>}
                        </div>
                        
                        {userPhotos.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                                {userPhotos.map(photo => (
                                    <div key={photo.id} className="bg-secondary" style={{ width: 'calc(33.33% - 4px)', aspectRatio: '1/1', overflow: 'hidden' }}>
                                        <img src={getPic(photo)} alt="Highlight" className="w-100 h-100 object-fit-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-white border rounded-4 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="text-secondary opacity-50 mb-2" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                                <div className="text-muted small fw-bold">Sem fotos publicadas.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* ESTATÍSTICAS */}
                {activeTab === 'stats' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                            <div>
                                <h6 className="fw-bold m-0 text-dark">Estatísticas</h6>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                                    Posição: <span className="text-danger">{currentPosition}</span>
                                </small>
                            </div>
                            
                            {/* Dropdown de Modalidade */}
                            <div style={{ width: '130px' }}>
                                <Input type="select" bsSize="sm" className="rounded-pill shadow-sm border-0 fw-bold bg-white text-dark" value={selectedModality} onChange={(e) => setSelectedModality(e.target.value)}>
                                    {availableModalities.length === 0 && <option value="Geral">Geral</option>}
                                    {availableModalities.map(mod => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </Input>
                            </div>
                        </div>

                        <Row className="gx-3 gy-3 mb-4">
                            <Col xs={6}>
                                <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                    <CardBody className="p-3 text-center">
                                        <div className="text-muted small text-uppercase fw-bold mb-1">Win Rate</div>
                                        <h3 className="fw-bold text-success m-0">{winRate}%</h3>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xs={6}>
                                <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                    <CardBody className="p-3 text-center">
                                        <div className="text-muted small text-uppercase fw-bold mb-1">Jogos Realizados</div>
                                        <h3 className="fw-bold text-dark m-0">{currentStats.matches_played}</h3>
                                    </CardBody>
                                </Card>
                            </Col>
                            
                            <Col xs={4}>
                                <Card className="shadow-sm border-0 rounded-4 bg-light border border-success border-opacity-25 h-100">
                                    <CardBody className="p-2 text-center">
                                        <h5 className="fw-bold text-success m-0">{currentStats.wins}</h5>
                                        <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>VITÓRIAS</small>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xs={4}>
                                <Card className="shadow-sm border-0 rounded-4 bg-light border border-secondary border-opacity-25 h-100">
                                    <CardBody className="p-2 text-center">
                                        <h5 className="fw-bold text-secondary m-0">{currentStats.draws}</h5>
                                        <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>EMPATES</small>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xs={4}>
                                <Card className="shadow-sm border-0 rounded-4 bg-light border border-danger border-opacity-25 h-100">
                                    <CardBody className="p-2 text-center">
                                        <h5 className="fw-bold text-danger m-0">{currentStats.losses}</h5>
                                        <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>DERROTAS</small>
                                    </CardBody>
                                </Card>
                            </Col>

                            {selectedModality === 'Basketball' ? (
                                <>
                                    <Col xs={4}>
                                        <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                            <CardBody className="p-2 text-center">
                                                <div className="text-muted small fw-bold mb-1" style={{ fontSize: '10px' }}>PONTOS</div>
                                                <h5 className="fw-bold text-dark m-0">{currentStats.points || 0}</h5>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col xs={4}>
                                        <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                            <CardBody className="p-2 text-center">
                                                <div className="text-muted small fw-bold mb-1" style={{ fontSize: '10px' }}>TRIPLOS</div>
                                                <h5 className="fw-bold text-dark m-0">{currentStats.triples || 0}</h5>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col xs={4}>
                                        <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                            <CardBody className="p-2 text-center">
                                                <div className="text-muted small fw-bold mb-1" style={{ fontSize: '10px' }}>BLOCKS</div>
                                                <h5 className="fw-bold text-dark m-0">{currentStats.blocks || 0}</h5>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </>
                            ) : (
                                <>
                                    <Col xs={6}>
                                        <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                            <CardBody className="p-3 d-flex justify-content-between align-items-center">
                                                <span className="text-muted fw-bold small">Golos</span>
                                                <span className="fw-bold fs-5 text-dark">{currentStats.goals || 0}</span>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col xs={6}>
                                        <Card className="shadow-sm border-0 rounded-4 bg-white h-100">
                                            <CardBody className="p-3 d-flex justify-content-between align-items-center">
                                                <span className="text-muted fw-bold small">Assistências</span>
                                                <span className="fw-bold fs-5 text-dark">{currentStats.assists || 0}</span>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </div>
                )}

                {/* EQUIPAS */}
                {activeTab === 'teams' && (
                    <div>
                        <h6 className="fw-bold mb-3 px-1 text-dark">Equipas Atuais ({userTeams.length})</h6>
                        {userTeams.length > 0 ? (
                            <Row className="gx-3 gy-3">
                                {userTeams.map(team => {
                                    
                                    let roles = [];
                                    if (team.coach == profileId) roles.push("Treinador");
                                    if (team.captain == profileId) roles.push("Capitão");
                                    
                                    // Se não for nem treinador nem capitão, é apenas jogador
                                    if (roles.length === 0) roles.push("Jogador");
                                    
                                    const roleText = roles.join(" & ");
                                    const badgeColor = roles.includes("Treinador") ? "danger" : (roles.includes("Capitão") ? "danger" : "secondary");

                                    return (
                                        <Col xs={6} key={team.id}>
                                            <div className="border border-secondary border-opacity-25 rounded-4 p-3 bg-white shadow-sm text-center h-100 pb-4 position-relative">
                                                <div className="rounded-circle overflow-hidden bg-light mx-auto mb-2 border" style={{ width: '50px', height: '50px' }}>
                                                    {getPic(team) ? <img src={getPic(team)} alt={team.name} className="w-100 h-100 object-fit-cover"/> : <span className="d-flex align-items-center justify-content-center h-100 fw-bold text-muted small">EQ</span>}
                                                </div>
                                                <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: '13px' }}>{team.name}</h6>
                                                <small className="text-muted d-block mb-3" style={{ fontSize: '11px' }}>{team.modality}</small>
                                                
                                                {/* Mini tag de Cargo alinhada ao fundo do cartão */}
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x w-100 mb-2">
                                                    <Badge color={badgeColor} className="rounded-pill shadow-sm text-truncate px-2" style={{ fontSize: '10px', letterSpacing: '0.5px', maxWidth: '90%' }}>
                                                        {roleText}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ) : (
                            <div className="text-center py-4 bg-white border rounded-4 shadow-sm">
                                <span className="text-muted small fw-bold">Sem equipas registadas.</span>
                            </div>
                        )}
                    </div>
                )}

            </Container>

            <BottomNavBar />
        </div>
    );
};

export default ProfilePage;