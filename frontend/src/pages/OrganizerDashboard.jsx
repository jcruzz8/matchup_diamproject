import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, CardBody, Button, Badge, Row, Col, Alert, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, FormGroup } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import {useUserContext} from "../context/UserProvider.jsx";

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

    // 2. Extrair o utilizador do contexto global
    const { user } = useUserContext();

    // Garantir que o ID é um número seguro
    const userId = Number(user?.player_id);

    const [myGames, setMyGames] = useState([]);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState(null);

    // 3. REMOVIDO: Estados inúteis (username), funções não utilizadas (handleLogout)
    // e o antigo useEffect do localStorage!

    useEffect(() => {
        // Se temos um ID válido (garantido pelas rotas protegidas do App.jsx)
        if (userId) {
            fetchMyData();
        }
    }, [userId]);

    const fetchMyData = async () => {
        try {
            const resGames = await axios.get(`http://localhost:8000/api/games/?organizer=${userId}`);
            setMyGames(resGames.data.reverse()); // Mais recentes primeiro

            const resRegs = await axios.get(`http://localhost:8000/api/registrations/`);
            setAllRegistrations(resRegs.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const handleAction = async (regId, actionType) => {
        try {
            await axios.patch(`http://localhost:8000/api/registrations/${regId}/`, { status: actionType });
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
                await axios.delete(`http://localhost:8000/api/games/${gameId}/`);
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
            await axios.patch(`http://localhost:8000/api/games/${editingGame.id}/`, {
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
            
            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            <TopNavBarSimple />

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

            <BottomNavBar />
        </div>
    );
};

export default OrganizerDashboard;