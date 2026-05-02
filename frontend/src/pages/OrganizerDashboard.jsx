import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, CardBody, Button, Badge, Row, Col, Alert, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, FormGroup, Dropdown, DropdownToggle } from 'reactstrap';

const MiniPitch = ({ positionId, modality, titulares, color1, color2 }) => {
    if (!positionId || (!positionId.includes('campo') && !positionId.includes('banco'))) {
        return <span className="fw-bold text-uppercase">{positionId}</span>;
    }

    const isEq1 = positionId.startsWith('eq1');
    const isBanco = positionId.includes('banco');
    const index = parseInt(positionId.split('-')[2]);
    const color = isEq1 ? color1 : color2;

    if (isBanco) {
        return <Badge style={{ backgroundColor: color }}>Banco #{index + 1}</Badge>;
    }

    const getPos = () => {
        const num = parseInt(titulares);
        let posArray = [];
        if (modality === 'Basketball') {
            if (num === 1) posArray = [{ top: '50%', left: '50%' }];
            else if (num === 2) posArray = [{ top: '35%', left: '35%' }, { top: '35%', left: '65%' }];
            else if (num === 3) posArray = [{ top: '25%', left: '50%' }, { top: '50%', left: '25%' }, { top: '50%', left: '75%' }];
            else posArray = [{ top: '15%', left: '50%' }, { top: '40%', left: '25%' }, { top: '40%', left: '75%' }, { top: '70%', left: '35%' }, { top: '70%', left: '65%' }];
        } else {
            if (num === 5) posArray = [{ top: '85%', left: '50%' }, { top: '55%', left: '25%' }, { top: '55%', left: '75%' }, { top: '25%', left: '35%' }, { top: '25%', left: '65%' }];
            else if (num === 7) posArray = [{ top: '85%', left: '50%' }, { top: '65%', left: '25%' }, { top: '65%', left: '75%' }, { top: '40%', left: '20%' }, { top: '40%', left: '50%' }, { top: '40%', left: '80%' }, { top: '15%', left: '50%' }];
            else posArray = [{ top: '90%', left: '50%' }, { top: '70%', left: '15%' }, { top: '70%', left: '38%' }, { top: '70%', left: '62%' }, { top: '70%', left: '85%' }, { top: '45%', left: '15%' }, { top: '45%', left: '38%' }, { top: '45%', left: '62%' }, { top: '45%', left: '85%' }, { top: '20%', left: '35%' }, { top: '20%', left: '65%' }];
        }
        
        let targetPos = posArray[index] || { top: '50%', left: '50%' };
        // Se for equipa 2, inverte o Top
        if (!isEq1) targetPos = { ...targetPos, top: `${100 - parseInt(targetPos.top)}%` };
        return targetPos;
    };

    const dotPos = getPos();

    return (
        <div className="position-relative border border-secondary bg-light" style={{ width: '40px', height: '60px', borderRadius: '3px' }}>
            {/* Linha de meio campo */}
            <div className="position-absolute top-50 start-0 w-100 border-top border-secondary opacity-50"></div>
            {/* Ponto do Jogador */}
            <div 
                className="position-absolute translate-middle rounded-circle" 
                style={{ top: dotPos.top, left: dotPos.left, width: '8px', height: '8px', backgroundColor: color, boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}
            ></div>
        </div>
    );
};

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [myGames, setMyGames] = useState([]);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState(null);
    const userId = localStorage.getItem('matchup_user_id');

    const toggleProfile = () => setProfileDropdownOpen((prevState) => !prevState);

    useEffect(() => {
        const storedUsername = localStorage.getItem('matchup_username');
        if (storedUsername) setUsername(storedUsername);
    }, []);

    const handleLogout = () => {
        console.log("Logout iniciado");
        localStorage.removeItem('matchup_user_id');
        localStorage.removeItem('matchup_username');
        window.location.href = '/landing';
    };

    useEffect(() => {
        if (!userId) navigate('/login');
        else fetchMyData();
    }, [userId, navigate]);

    const fetchMyData = async () => {
        try {
            const resGames = await axios.get(`http://127.0.0.1:8000/api/games/?organizer=${userId}`);
            setMyGames(resGames.data.reverse()); // Mais recentes primeiro

            const resRegs = await axios.get(`http://127.0.0.1:8000/api/registrations/`);
            setAllRegistrations(resRegs.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const handleAction = async (regId, actionType) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/registrations/${regId}/`, { status: actionType });
            setAlertConfig({ show: true, message: actionType === 'APPROVED' ? 'Inscrição Aceite!' : 'Inscrição Rejeitada.', color: actionType === 'APPROVED' ? 'success' : 'secondary' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'success' }), 2000);
            fetchMyData();
        } catch (error) {
            console.error("Erro do Django ao Aceitar/Rejeitar:", error.response?.data || error.message);
            setAlertConfig({ show: true, message: 'Erro ao processar o pedido.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
        }
    };

    const handleDeleteGame = async (gameId) => {
        if (window.confirm("Tens a certeza que queres apagar este Match? Esta ação vai cancelar todos os pedidos.")) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/games/${gameId}/`);
                setAlertConfig({ show: true, message: 'Match apagado com sucesso.', color: 'success' });
                setTimeout(() => setAlertConfig({ show: false, message: '', color: 'success' }), 2000);
                fetchMyData();
            } catch (error) {
                console.error("Erro do Django ao Apagar:", error.response?.data || error.message);
                setAlertConfig({ show: true, message: 'Erro ao apagar o Match.', color: 'danger' });
                setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            }
        }
    };

    const openEditModal = (game) => {
        setEditingGame(game);
        setEditModalOpen(true);
    };

    const handleUpdateGame = async () => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/games/${editingGame.id}/`, {
                location: editingGame.location,
                date: editingGame.date,
                time: editingGame.time,
                price: editingGame.price
            });
            
            setAlertConfig({ show: true, message: 'Match atualizado com sucesso!', color: 'success' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'success' }), 2000);
            setEditModalOpen(false);
            fetchMyData();
        } catch (error) {
            console.error("Erro do Django ao Atualizar:", error.response?.data || error.message);
            setAlertConfig({ show: true, message: 'Erro ao atualizar o Match.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
        }
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            {/* ALERTA */}
            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            {/* BARRA SUPERIOR */}
            <div className="bg-white border-bottom sticky-top shadow-sm px-3 py-2 d-flex justify-content-between align-items-center">
                
                <div className="d-flex align-items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="cursor-pointer" viewBox="0 0 16 16">
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                    </svg>
                    <div className="position-relative cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                        </svg>
                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                    </div>
                </div>

                <h4 className="text-center w-100 text-danger fw-bold py-2">MATCH UP</h4>

                <Dropdown isOpen={profileDropdownOpen} toggle={toggleProfile}>
                    <DropdownToggle tag="div" className="cursor-pointer">
                        <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center" style={{ width: '35px', height: '35px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-white" viewBox="0 0 16 16">
                                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                            </svg>
                        </div>
                    </DropdownToggle>
                    
                    {profileDropdownOpen && (
                        <div className="position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 bg-white" style={{ minWidth: '260px', zIndex: 1050 }} onClick={(e) => e.stopPropagation()}>
                            <div className="p-3">
                                <div className="fw-bold fs-6 text-dark pb-0">{username}</div>
                                <div className="border-bottom my-2" />
                                <div className="text-muted small text-uppercase fw-bold pt-0">Os Teus Match</div>
                                <div className="px-0 pb-2">
                                    <div className="p-2 border rounded-3 bg-light border-start border-4 border-danger cursor-pointer mb-2">
                                        <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Futebol - Pavilhão da Luz</h6>
                                        <small className="text-muted" style={{ fontSize: '12px' }}>Sexta-feira • 21:00</small>
                                    </div>
                                </div>
                                <div className="border-bottom my-2" />
                                <button type="button" className="btn btn-link text-start w-100 py-2">Ver Perfil</button>
                                <button type="button" className="btn btn-link text-start w-100 py-2">Editar Perfil</button>
                                <button type="button" onClick={() => navigate('/organizar')} className="btn btn-link text-start w-100 py-2">Organizar Os Meus Match</button>
                                <div className="border-bottom my-2" />
                                <button type="button" onMouseDown={handleLogout} className="btn btn-link text-start w-100 text-danger fw-bold py-2">Sair do Perfil</button>
                            </div>
                        </div>
                    )}
                </Dropdown>
            </div>

            {/* Matchs Organizados */}
            <Container className="pt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0">Os Meus Match</h4>
                </div>

                {myGames.length === 0 ? (
                    <div className="text-center py-5">
                        <h5 className="text-muted">Ainda não organizaste nenhum jogo.</h5>
                        <Button color="danger" className="mt-3 rounded-pill px-4 fw-bold" onClick={() => navigate('/criar')}>Criar Novo Match</Button>
                    </div>
                ) : (
                    myGames.map(game => {
                        const gameRegs = allRegistrations.filter(reg => reg.game === game.id);

                        return (
                            <Card key={game.id} className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
                                <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="m-0 fw-bold text-uppercase">{game.modality}</h6>
                                        <small className="text-light">{game.location} • {game.date} às {game.time}</small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button color="light" outline size="sm" className="fw-bold" onClick={() => openEditModal(game)}>Editar</Button>
                                        <Button color="danger" size="sm" className="fw-bold" onClick={() => handleDeleteGame(game.id)}>Apagar</Button>
                                    </div>
                                </div>
                                <CardBody className="bg-white">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2">Pedidos de Inscrição</h6>
                                    
                                    {gameRegs.length === 0 ? (
                                        <p className="text-muted small mb-0">Sem pedidos de momento.</p>
                                    ) : (
                                        gameRegs.map(reg => (
                                            <Row key={reg.id} className="align-items-center mb-2 bg-light p-2 rounded-3 border mx-0">
                                                <Col xs={7} className="d-flex align-items-center gap-3 px-1">
                                                    {/* O Mini Campo (só para Escolha Livre) */}
                                                    {game.distribution_model === 'Escolha Livre' && (
                                                        <MiniPitch 
                                                            positionId={reg.position_id} 
                                                            modality={game.modality} 
                                                            titulares={game.titulares} 
                                                            color1={game.cor_equipa1} 
                                                            color2={game.cor_equipa2} 
                                                        />
                                                    )}
                                                    
                                                    <div>
                                                        <div className="fw-bold fs-6">
                                                            {reg.team ? reg.team_name : reg.player_username}
                                                        </div>
                                                        <div className="small text-muted" style={{ fontSize: '12px' }}>
                                                            {game.distribution_model === 'Auto-Balanceamento' ? 'Auto-Balanceamento' : `Pos: ${reg.position_id}`}
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col xs={5} className="text-end px-1">
                                                    {reg.status === 'PENDING' && (
                                                        <div className="d-flex gap-1 justify-content-end">
                                                            <Button color="success" size="sm" className="fw-bold shadow-sm" onClick={() => handleAction(reg.id, 'APPROVED')}>Aceitar</Button>
                                                            <Button color="danger" outline size="sm" className="fw-bold shadow-sm px-2" onClick={() => handleAction(reg.id, 'REJECTED')}>✕</Button>
                                                        </div>
                                                    )}
                                                    {reg.status === 'APPROVED' && <Badge color="success" className="p-2">Aceite</Badge>}
                                                    {reg.status === 'REJECTED' && <Badge color="secondary" className="p-2">Rejeitado</Badge>}
                                                </Col>
                                            </Row>
                                        ))
                                    )}
                                </CardBody>
                            </Card>
                        )
                    })
                )}

                {/* MODAL DE EDIÇÃO DE JOGO */}
                <Modal isOpen={editModalOpen} toggle={() => setEditModalOpen(!editModalOpen)} centered>
                    <ModalHeader toggle={() => setEditModalOpen(!editModalOpen)} className="fw-bold text-dark border-bottom-0">
                        Editar Detalhes do Match
                    </ModalHeader>
                    <ModalBody>
                        {editingGame && (
                            <>
                                <FormGroup>
                                    <Label className="fw-bold small text-muted">Localização</Label>
                                    <Input type="text" value={editingGame.location} onChange={(e) => setEditingGame({...editingGame, location: e.target.value})} />
                                </FormGroup>
                                <Row>
                                    <Col xs={6}>
                                        <FormGroup>
                                            <Label className="fw-bold small text-muted">Data</Label>
                                            <Input type="date" value={editingGame.date} onChange={(e) => setEditingGame({...editingGame, date: e.target.value})} />
                                        </FormGroup>
                                    </Col>
                                    <Col xs={6}>
                                        <FormGroup>
                                            <Label className="fw-bold small text-muted">Hora</Label>
                                            <Input type="time" value={editingGame.time} onChange={(e) => setEditingGame({...editingGame, time: e.target.value})} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <FormGroup>
                                    <Label className="fw-bold small text-muted">Preço Total (€)</Label>
                                    <Input type="number" step="0.01" value={editingGame.price} onChange={(e) => setEditingGame({...editingGame, price: e.target.value})} />
                                </FormGroup>
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter className="border-top-0 pt-0">
                        <Button color="light" onClick={() => setEditModalOpen(false)} className="fw-bold">Cancelar</Button>
                        <Button color="success" onClick={handleUpdateGame} className="fw-bold">Guardar Alterações</Button>
                    </ModalFooter>
                </Modal>

            </Container>

            {/* BARRA INFERIOR */}
            <div className="bg-white border-top fixed-bottom d-flex justify-content-around align-items-center py-2 px-1 shadow-lg" style={{ zIndex: 1040, height: '65px' }}>
                <Link to="/" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z"/><path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z"/></svg>
                </Link>
                <Link to="/comunidade" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>
                </Link>
                <Link to="/criar" className="text-danger d-flex flex-column align-items-center text-decoration-none" style={{ transform: 'scale(1.2)', marginBottom: '5px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
                </Link>
                <Link to="/pesquisar" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>
                </Link>
                <Link to="/financas" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/><path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/></svg>
                </Link>
            </div>
        </div>
    );
};

export default OrganizerDashboard;