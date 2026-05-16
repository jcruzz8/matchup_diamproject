import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dropdown, DropdownToggle } from 'reactstrap';
import {useUserContext} from "../context/UserProvider.jsx";

const ProfileDropdown = () => {
const navigate = useNavigate();

    // 2. Extrair o utilizador e a função de atualizar (setUser) do contexto
    const { user, setUser } = useUserContext();

    // 3. Garantir o ID numérico e o username diretamente do estado global de forma segura
    const userId = Number(user?.player_id);
    const username = user?.username || "Jogador";

    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [userProfilePic, setUserProfilePic] = useState(null);
    const [nextGame, setNextGame] = useState(null);

    // 4. O useEffect agora reage de forma fluída à variável do contexto
    useEffect(() => {
        // Se por algum motivo o dropdown for desenhado sem sessão, não tentamos ir buscar nada
        if (!userId) return;

        const fetchUserData = async () => {
            try {
                // 1. Foto de Perfil
                const resPlayer = await axios.get(`http://localhost:8000/api/players/${userId}/`);
                let picUrl = resPlayer.data.photo || resPlayer.data.image || resPlayer.data.avatar || resPlayer.data.profile_picture;
                if (picUrl) {
                    if (picUrl.startsWith('/')) picUrl = `http://localhost:8000${picUrl}`;
                    setUserProfilePic(picUrl);
                }

                // 2. Jogos Aceites
                const resRegs = await axios.get(`http://localhost:8000/api/registrations/`);

                // Graças ao Number(), podemos usar '===' de forma segura!
                const myAcceptedRegs = resRegs.data.filter(reg => reg.player === userId && reg.status === 'APPROVED');

                const resGames = await axios.get(`http://localhost:8000/api/games/`);
                let myGames = myAcceptedRegs.map(reg => resGames.data.find(g => g.id === reg.game)).filter(g => g !== undefined);

                const agora = new Date();

                // Filtra para mostrar apenas jogos no futuro
                let jogosFuturos = myGames.filter(g => new Date(`${g.date}T${g.time}`) >= agora);
                jogosFuturos.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

                // Guarda apenas o primeiro (se existir)
                if (jogosFuturos.length > 0) {
                    setNextGame(jogosFuturos[0]);
                }

            } catch (error) {
                console.error("Erro perfil:", error);
            }
        };
        fetchUserData();
    }, [userId]); // O efeito é reavaliado se o ID de utilizador mudar

    // 5. A LÓGICA DE LOGOUT DO SLIDE 18
    const handleLogout = async () => {
        try {
            // Pede ao Django para apagar a sessão no servidor (destrói o Cookie nativo)
            await axios.post('http://localhost:8000/api/logout/', {}, {
                headers: { 'X-CSRFToken':getCSRFToken(),'Content-Type': 'multipart/form-data' }, withCredentials: true
            });
        } catch (error) {
            console.error("Erro ao fechar sessão no backend:", error);
        } finally {
            // ADEUS localStorage e window.location.href!
            // Atualizamos o contexto de forma reativa:
            setUser(null);

            // Redirecionamos através do React Router de forma suave
            navigate('/landing');
        }
    };

    const getCSRFToken = () => {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
};

    return (
        <Dropdown isOpen={profileDropdownOpen} toggle={() => setProfileDropdownOpen(!profileDropdownOpen)}>
            <DropdownToggle tag="div" className="cursor-pointer">
                <div className="rounded-circle bg-dark d-flex justify-content-center align-items-center overflow-hidden shadow-sm border" style={{ width: '38px', height: '38px' }}>
                    {userProfilePic ? (
                        <img src={userProfilePic} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-white" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
                    )}
                </div>
            </DropdownToggle>

            {profileDropdownOpen && (
                <div className="position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 bg-white" style={{ minWidth: '280px', zIndex: 1050 }} onClick={(e) => e.stopPropagation()}>
                    <div className="p-3">
                        <div className="fw-bold fs-6 text-dark pb-0">{username}</div>
                        <div className="border-bottom my-2" />
                        
                        <div className="d-flex justify-content-between align-items-center mb-2 pt-1">
                            <span className="text-muted small text-uppercase fw-bold m-0">Próximo Match</span>
                        </div>
                        
                        <div className="px-0 pb-2">
                            {nextGame ? (
                                <div className="border border-danger border-opacity-50 rounded-4 p-3 bg-light position-relative shadow-sm cursor-pointer" onClick={() => navigate('/estado-match')}>
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="bg-danger text-white rounded-circle d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: '35px', height: '35px', minWidth: '35px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M10.536 3.464a5 5 0 1 0-7.072 7.072l3.182 3.182a.5.5 0 0 0 .708 0l3.182-3.182a5 5 0 0 0 0-7.072zM7 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>{nextGame.modality}</h6>
                                            <div className="text-muted fw-semibold text-truncate" style={{ fontSize: '11px', maxWidth: '160px' }}>{nextGame.location}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center bg-white rounded-3 p-2 border border-secondary border-opacity-25 mt-2">
                                        <div className="text-danger fw-bold" style={{ fontSize: '12px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="me-1 mb-1" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/></svg>
                                            {nextGame.date}
                                        </div>
                                        <span className="badge bg-dark rounded-pill py-1 px-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className="me-1 mb-1" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
                                            {nextGame.time}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3 border rounded-3 bg-light">
                                    <small className="text-muted d-block fw-bold">Sem jogos confirmados.</small>
                                </div>
                            )}
                        </div>

                        <div className="border-bottom my-2" />
                        <button type="button" onMouseDown={() => navigate('/perfil')} className="btn btn-link text-start w-100 py-2 text-decoration-none text-dark fw-semibold">Ver Perfil</button>
                        <button type="button" onMouseDown={() => navigate('/editar-perfil')} className="btn btn-link text-start w-100 py-2 text-decoration-none text-dark fw-semibold">Editar Perfil</button>
                        <button type="button" onMouseDown={() => navigate('/organizar')} className="btn btn-link text-start w-100 py-2 text-decoration-none text-dark fw-semibold">Gerir Match's</button>
                        <button type="button" onMouseDown={() => navigate('/estado-match')} className="btn btn-link text-start w-100 py-2 text-decoration-none text-dark fw-semibold">Consultar Match's</button>
                        <div className="border-bottom my-2" />
                        <button type="button" onMouseDown={handleLogout} className="btn btn-link text-start w-100 text-danger fw-bold py-2 text-decoration-none">Sair do Perfil</button>
                    </div>
                </div>
            )}
        </Dropdown>
    );
};
export default ProfileDropdown;