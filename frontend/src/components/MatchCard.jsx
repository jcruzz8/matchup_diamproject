import { useState } from 'react';
import { Card, CardBody, Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, Alert } from 'reactstrap';
import axios from 'axios';
import {useUserContext} from "../context/UserProvider.jsx";

const MatchCard = ({ game, userRegistrationStatus }) => {
// 2. Extrair o utilizador do contexto
    const { user } = useUserContext();

    // 3. Garantir o ID numérico seguro (prevenido para o caso de no futuro mostrares este cartão numa página pública)
    const userId = user?.player_id ? Number(user.player_id) : null;

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });
    const [posicaoSelecionada, setPosicaoSelecionada] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [myTeams, setMyTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [targetPosition, setTargetPosition] = useState('');

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        setSelectedTeam(null);
    };

    // Abre o Modal e vai buscar as equipas ao Django
    const openTeamModal = async (position) => {
        // Já não lemos do localStorage! Usamos a variável userId
        if (!userId) {
            setAlertConfig({ show: true, message: 'Precisas de iniciar sessão para inscrever a tua equipa!', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            return;
        }

        setTargetPosition(position);

        try {
            const response = await axios.get(`http://localhost:8000/api/teams/?captain=${userId}`);
            setMyTeams(response.data);
            setModalOpen(true);
        } catch (error) {
            console.error("Erro ao buscar equipas:", error);
            setAlertConfig({ show: true, message: 'Não foi possível carregar as tuas equipas.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
        }
    };

    // Envia o pedido de inscrição (Fica Pendente)
    const handleTeamRegistration = async () => {
        if (!selectedTeam || !userId) return;

        try {
            await axios.post('http://localhost:8000/api/registrations/', {
                game: game.id, player: userId, team: selectedTeam.id, position_id: targetPosition, status: 'PENDING'
            }, {
                headers: { 'X-CSRFToken':getCSRFToken(),'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setModalOpen(false); // Fecha o modal
            setAlertConfig({ show: true, message: 'Pedido da equipa enviado com sucesso!', color: 'success' });
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error("Erro ao inscrever equipa:", error);
            setAlertConfig({ show: true, message: 'Erro ao inscrever a equipa. Já enviaram um pedido para este jogo?', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
        }
    };

    // Função para colocar os jogadores nos campos
    const getPosicoes = (modalidade, titulares) => {
        const num = parseInt(titulares);
        if (modalidade === 'Basketball') {
            if (num === 1) return [{ top: '50%', left: '50%' }];
            if (num === 2) return [{ top: '35%', left: '35%' }, { top: '35%', left: '65%' }];
            if (num === 3) return [{ top: '25%', left: '50%' }, { top: '50%', left: '25%' }, { top: '50%', left: '75%' }];
            return [
                { top: '15%', left: '50%' }, { top: '40%', left: '25%' }, { top: '40%', left: '75%' },
                { top: '70%', left: '35%' }, { top: '70%', left: '65%' }
            ];
        } else {
            if (num === 5) return [
                { top: '85%', left: '50%' },
                { top: '55%', left: '25%' }, { top: '55%', left: '75%' },
                { top: '25%', left: '35%' }, { top: '25%', left: '65%' }
            ];
            if (num === 7) return [
                { top: '85%', left: '50%' },
                { top: '65%', left: '25%' }, { top: '65%', left: '75%' },
                { top: '40%', left: '20%' }, { top: '40%', left: '50%' }, { top: '40%', left: '80%' },
                { top: '15%', left: '50%' }
            ];
            if (num === 9) return [
                { top: '85%', left: '50%' },
                { top: '65%', left: '20%' }, { top: '65%', left: '50%' }, { top: '65%', left: '80%' },
                { top: '40%', left: '25%' }, { top: '40%', left: '75%' },
                { top: '15%', left: '25%' }, { top: '15%', left: '50%' }, { top: '15%', left: '75%' }
            ];
            return [
                { top: '90%', left: '50%' },
                { top: '70%', left: '15%' }, { top: '70%', left: '38%' }, { top: '70%', left: '62%' }, { top: '70%', left: '85%' },
                { top: '45%', left: '15%' }, { top: '45%', left: '38%' }, { top: '45%', left: '62%' }, { top: '45%', left: '85%' },
                { top: '20%', left: '35%' }, { top: '20%', left: '65%' }
            ];
        }
    };

    const posicoesCampo = getPosicoes(game.modality, game.titulares);
    const posicoesBanco = Array.from({ length: parseInt(game.suplentes || 0) }, (_, i) => i);

    const handleInscrever = async () => {
        if (!userId) {
            setAlertConfig({ show: true, message: 'Precisas de ter sessão iniciada para te inscreveres!', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            return;
        }

        // Simplificado de parseInt(localStorage...) para apenas userId
        if (game.occupied_data?.players?.includes(userId)) {
            setAlertConfig({ show: true, message: 'Já tens um pedido pendente ou aceite para este match!', color: 'warning' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'warning' }), 3000);
            return;
        }

        try {
            if (game.distribution_model === 'Auto-Balanceamento') {
                await axios.post('http://localhost:8000/api/registrations/', {
                    game: game.id, player: userId, position_id: 'auto', status: 'PENDING'
                    }, {
                    headers: { 'X-CSRFToken':getCSRFToken(),'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });

                setAlertConfig({ show: true, message: 'Pedido enviado para Auto-Balanceamento!', color: 'success' });
                setTimeout(() => window.location.reload(), 2000);
            }
            else if (game.distribution_model === 'Escolha Livre') {
                if (!posicaoSelecionada) return;
                await axios.post('http://localhost:8000/api/registrations/', {
                    game: game.id, player: userId, position_id: posicaoSelecionada.id, status: 'PENDING'
                    }, {
                    headers: { 'X-CSRFToken':getCSRFToken(),'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });

                setAlertConfig({ show: true, message: 'Lugar Marcado! Aguarda a aprovação do organizador.', color: 'success' });
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (error) {
            console.error("Erro ao inscrever:", error);
            setAlertConfig({ show: true, message: 'Ocorreu um erro ao tentar inscrever. Tenta novamente.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
        }
    };

    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    }

    return (
        <>
            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            <Card className="mb-4 shadow-sm border border-2 rounded-4 border-danger overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
                <CardBody className="p-4">

                    <h5 className="fw-bold text-center text-uppercase border-bottom border-danger pb-2 mb-3">
                        MATCH UP
                    </h5>

                    <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold fs-6">Modalidade: <span className="text-muted">{game.modality} ({game.titulares}v{game.titulares})</span></span>
                        <span className="fw-bold">Preço: <span className={game.price === '0.00' ? "text-success" : "text-dark"}>{game.price === '0.00' ? 'Grátis' : `€${game.price}/Pessoa`}</span></span>
                    </div>

                    <div className="d-flex justify-content-between mb-4 border-bottom pb-3">
                        <span className="fw-bold fs-6">Campo: <span className="text-muted">{game.location}</span></span>
                        <span className="fw-bold text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-1 mb-1" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" /><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" /></svg>
                            {game.date} às {game.time}
                        </span>
                    </div>

                    {/* AUTO-BALANCEAMENTO */}
                    {game.distribution_model === 'Auto-Balanceamento' && (
                        <>
                            <div className="bg-light border border-secondary p-3 rounded-3 mb-4 text-center shadow-sm">
                                <span className="text-dark fw-medium" style={{ fontSize: '15px' }}>
                                    A distribuição das equipas será feita automaticamente consoante as estatísticas de cada jogador de forma ao jogo ser equilibrado.
                                </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <span className="fw-bold fs-5">Vagas Restantes: <span className="text-danger border-bottom border-danger pb-1 px-2">{game.vagas}</span></span>
                                <Button
                                    color={(userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING') ? "success" : "danger"}
                                    className="px-4 py-2 fw-bold fs-5 shadow-sm rounded-3"
                                    onClick={handleInscrever}
                                    disabled={userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING' || game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))}
                                >
                                    {userRegistrationStatus === 'APPROVED' ? 'CONFIRMADO' :
                                        userRegistrationStatus === 'PENDING' ? 'PENDENTE' :
                                            game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id'))) ? 'Já Inscrito' : 'Inscrever'}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* EQUIPA VS EQUIPA */}
                    {game.distribution_model === 'Equipa vs Equipa' && (
                        <Row className="gx-3">
                            <Col xs={6} className="border-end border-dark text-center">
                                <h6 className="fw-bold mb-4">Equipa 1 <span className="d-inline-block align-middle ms-2" style={{ backgroundColor: game.cor_equipa1, width: '16px', height: '16px', border: '1px solid black', borderRadius: '3px' }}></span></h6>
                                <Button
                                    outline={userRegistrationStatus !== 'APPROVED' && userRegistrationStatus !== 'PENDING' && !game.occupied_data?.positions?.includes('equipa1') && !game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))}
                                    color={(userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING') ? "success" : game.occupied_data?.positions?.includes('equipa1') ? "success" : "dark"}
                                    className="w-100 fw-bold border-2 rounded-3 py-2"
                                    onClick={() => openTeamModal('equipa1')}
                                    disabled={userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING' || game.occupied_data?.positions?.includes('equipa1') || game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))}
                                >
                                    {userRegistrationStatus === 'APPROVED' ? <><span className="fw-bold fs-5">CONFIRMADO</span></> :
                                        userRegistrationStatus === 'PENDING' ? <><span className="fw-bold fs-5">PENDENTE</span></> :
                                            game.occupied_data?.positions?.includes('equipa1')
                                                ? <><span className="small fw-normal">Ocupado por:</span><br />{game.occupied_data.teams['equipa1']}</>
                                                : game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))
                                                    ? <><span className="fw-bold">Pedido Enviado</span><br /><small>Aguarda aprovação</small></>
                                                    : <><span className="fw-bold">Inscrever a</span><br />Minha Equipa</>
                                    }
                                </Button>
                            </Col>

                            <Col xs={6} className="text-center">
                                <h6 className="fw-bold mb-4">Equipa 2 <span className="d-inline-block align-middle ms-2" style={{ backgroundColor: game.cor_equipa2, width: '16px', height: '16px', border: '1px solid black', borderRadius: '3px' }}></span></h6>
                                <Button
                                    outline={userRegistrationStatus !== 'APPROVED' && userRegistrationStatus !== 'PENDING' && !game.occupied_data?.positions?.includes('equipa2') && !game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))}
                                    color={(userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING') ? "success" : game.occupied_data?.positions?.includes('equipa2') ? "success" : "dark"}
                                    className="w-100 fw-bold border-2 rounded-3 py-2"
                                    onClick={() => openTeamModal('equipa2')}
                                    disabled={userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING' || game.occupied_data?.positions?.includes('equipa2') || game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))}
                                >
                                    {userRegistrationStatus === 'APPROVED' ? <><span className="fw-bold fs-5">CONFIRMADO</span></> :
                                        userRegistrationStatus === 'PENDING' ? <><span className="fw-bold fs-5">PENDENTE</span></> :
                                            game.occupied_data?.positions?.includes('equipa2')
                                                ? <><span className="small fw-normal">Ocupado por:</span><br />{game.occupied_data.teams['equipa2']}</>
                                                : game.occupied_data?.players?.includes(parseInt(localStorage.getItem('matchup_user_id')))
                                                    ? <><span className="fw-bold">Pedido Enviado</span><br /><small>Aguarda aprovação</small></>
                                                    : <><span className="fw-bold">Inscrever a</span><br />Minha Equipa</>
                                    }
                                </Button>
                            </Col>
                        </Row>
                    )}

                    {/* MODAL DE ESCOLHER EQUIPA */}
                    <Modal isOpen={modalOpen} toggle={toggleModal} centered>
                        <ModalHeader toggle={toggleModal} className="fw-bold text-dark border-bottom-0 pb-0">
                            Escolhe a tua Equipa
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-muted small mb-3">Apenas podes inscrever equipas das quais és capitão.</p>

                            {myTeams.length > 0 ? (
                                <ListGroup className="rounded-3 shadow-sm border-0">
                                    {myTeams.map(team => (
                                        <ListGroupItem
                                            key={team.id}
                                            tag="button"
                                            action
                                            active={selectedTeam?.id === team.id}
                                            onClick={() => setSelectedTeam(team)}
                                            className={`border-secondary border-opacity-25 py-3 ${selectedTeam?.id === team.id ? 'bg-danger border-danger' : ''}`}
                                        >
                                            <div className="fw-bold fs-5">{team.name}</div>
                                            <small className={selectedTeam?.id === team.id ? 'text-white' : 'text-muted'}>
                                                Selecionar para a {targetPosition === 'equipa1' ? 'Equipa 1' : 'Equipa 2'}
                                            </small>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            ) : (
                                <div className="text-center py-4 bg-light rounded-3">
                                    <span className="fw-bold text-muted">Ainda não és capitão de nenhuma equipa.</span>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="border-top-0 pt-0">
                            <Button color="light" onClick={toggleModal} className="fw-bold">Cancelar</Button>
                            <Button className="btn-custom-red fw-bold px-4" disabled={!selectedTeam} onClick={handleTeamRegistration}>
                                Confirmar Pedido
                            </Button>
                        </ModalFooter>
                    </Modal>

                    {/* ESCOLHA LIVRE */}
                    {game.distribution_model === 'Escolha Livre' && (
                        <>
                            <Row className="gx-3 mb-4">
                                {/* ----- EQUIPA 1 ----- */}
                                <Col xs={6} className="border-end border-dark text-center">
                                    <h6 className="fw-bold mb-3">Equipa 1 <span className="d-inline-block align-middle ms-2" style={{ backgroundColor: game.cor_equipa1, width: '16px', height: '16px', border: '1px solid black', borderRadius: '3px' }}></span></h6>

                                    <div className="mx-auto position-relative border border-2 bg-light shadow-sm mb-2 overflow-hidden" style={{ width: '100%', maxWidth: '140px', height: '180px', borderColor: game.cor_equipa1, borderRadius: '4px' }}>

                                        {game.modality === 'Basketball' ? (
                                            <>
                                                <div className="position-absolute top-50 start-0 w-100 border-top border-2" style={{ borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-50 start-50 translate-middle border border-2 rounded-circle" style={{ width: '30px', height: '30px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '40px', height: '35px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '40px', height: '35px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '100px', height: '60px', borderColor: game.cor_equipa1, opacity: 0.4, borderBottomLeftRadius: '50px', borderBottomRightRadius: '50px' }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '100px', height: '60px', borderColor: game.cor_equipa1, opacity: 0.4, borderTopLeftRadius: '50px', borderTopRightRadius: '50px' }}></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="position-absolute top-50 start-0 w-100 border-top border-2" style={{ borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-50 start-50 translate-middle border border-2 rounded-circle" style={{ width: '40px', height: '40px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '50px', height: '20px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '50px', height: '20px', borderColor: game.cor_equipa1, opacity: 0.4 }}></div>
                                            </>
                                        )}

                                        {posicoesCampo.map((pos, index) => {
                                            const posId = `eq1-campo-${index}`;
                                            const isOccupied = game.occupied_data?.positions?.includes(posId);
                                            const isSelected = posicaoSelecionada?.id === posId;

                                            return (
                                                <div
                                                    key={posId}
                                                    onClick={() => !isOccupied && setPosicaoSelecionada({ id: posId, equipa: 1, tipo: 'campo', index })}
                                                    className={`position-absolute translate-middle rounded-circle border border-2 transition-all ${isOccupied ? '' : 'cursor-pointer'}`}
                                                    style={{
                                                        top: pos.top, left: pos.left, width: '20px', height: '20px',
                                                        backgroundColor: isOccupied ? '#6c757d' : (isSelected ? game.cor_equipa1 : '#fff'),
                                                        borderColor: isOccupied ? '#495057' : game.cor_equipa1,
                                                        transform: isSelected ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                                                        boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
                                                        cursor: isOccupied ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title={isOccupied ? "Posição Ocupada" : "Livre"}
                                                >
                                                    {isOccupied && <span className="position-absolute top-50 start-50 translate-middle text-white fw-bold" style={{ fontSize: '10px' }}>✕</span>}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* BANCO (Caso haja suplentes) */}
                                    {posicoesBanco.length > 0 && (
                                        <div className="mx-auto border border-2 rounded-2 p-1 bg-light mt-1" style={{ width: '100%', maxWidth: '140px', borderColor: game.cor_equipa1 }}>
                                            <div className="small fw-bold mb-1 text-muted" style={{ fontSize: '10px' }}>BANCO</div>
                                            <div className="d-flex justify-content-center gap-2 flex-wrap">
                                                {posicoesBanco.map((_, index) => {
                                                    const posId = `eq1-banco-${index}`;
                                                    const isOccupied = game.occupied_data?.positions?.includes(posId);
                                                    const isSelected = posicaoSelecionada?.id === posId;
                                                    return (
                                                        <div
                                                            key={posId}
                                                            onClick={() => !isOccupied && setPosicaoSelecionada({ id: posId, equipa: 1, tipo: 'banco', index })}
                                                            className="rounded-circle border border-2 transition-all"
                                                            style={{
                                                                width: '18px', height: '18px',
                                                                backgroundColor: isOccupied ? '#6c757d' : (isSelected ? game.cor_equipa1 : '#fff'),
                                                                borderColor: isOccupied ? '#495057' : game.cor_equipa1,
                                                                transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                                                                cursor: isOccupied ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            {isOccupied && <span className="d-block text-white fw-bold text-center" style={{ fontSize: '9px', lineHeight: '14px' }}>✕</span>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </Col>

                                {/* EQUIPA 2 (Invertida) */}
                                <Col xs={6} className="text-center">
                                    <h6 className="fw-bold mb-3">Equipa 2 <span className="d-inline-block align-middle ms-2" style={{ backgroundColor: game.cor_equipa2, width: '16px', height: '16px', border: '1px solid black', borderRadius: '3px' }}></span></h6>

                                    <div className="mx-auto position-relative border border-2 bg-light shadow-sm mb-2 overflow-hidden" style={{ width: '100%', maxWidth: '140px', height: '180px', borderColor: game.cor_equipa2, borderRadius: '4px' }}>

                                        {game.modality === 'Basketball' ? (
                                            <>
                                                <div className="position-absolute top-50 start-0 w-100 border-top border-2" style={{ borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-50 start-50 translate-middle border border-2 rounded-circle" style={{ width: '30px', height: '30px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '40px', height: '35px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '40px', height: '35px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '100px', height: '60px', borderColor: game.cor_equipa2, opacity: 0.4, borderBottomLeftRadius: '50px', borderBottomRightRadius: '50px' }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '100px', height: '60px', borderColor: game.cor_equipa2, opacity: 0.4, borderTopLeftRadius: '50px', borderTopRightRadius: '50px' }}></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="position-absolute top-50 start-0 w-100 border-top border-2" style={{ borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-50 start-50 translate-middle border border-2 rounded-circle" style={{ width: '40px', height: '40px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute top-0 start-50 translate-middle-x border border-top-0 border-2" style={{ width: '50px', height: '20px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x border border-bottom-0 border-2" style={{ width: '50px', height: '20px', borderColor: game.cor_equipa2, opacity: 0.4 }}></div>
                                            </>
                                        )}

                                        {posicoesCampo.map((pos, index) => {
                                            const posId = `eq2-campo-${index}`;
                                            const isOccupied = game.occupied_data?.positions?.includes(posId);
                                            const isSelected = posicaoSelecionada?.id === posId;

                                            const topInvertido = `${100 - parseInt(pos.top)}%`;

                                            return (
                                                <div
                                                    key={posId}
                                                    onClick={() => !isOccupied && setPosicaoSelecionada({ id: posId, equipa: 2, tipo: 'campo', index })}
                                                    className={`position-absolute translate-middle rounded-circle border border-2 transition-all ${isOccupied ? '' : 'cursor-pointer'}`}
                                                    style={{
                                                        top: topInvertido, left: pos.left, width: '20px', height: '20px',
                                                        backgroundColor: isOccupied ? '#6c757d' : (isSelected ? game.cor_equipa2 : '#fff'),
                                                        borderColor: isOccupied ? '#495057' : game.cor_equipa2,
                                                        transform: isSelected ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                                                        boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.5)' : 'none',
                                                        cursor: isOccupied ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {isOccupied && <span className="position-absolute top-50 start-50 translate-middle text-white fw-bold" style={{ fontSize: '10px' }}>✕</span>}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* BANCO EQUIPA 2 */}
                                    {posicoesBanco.length > 0 && (
                                        <div className="mx-auto border border-2 rounded-2 p-1 bg-light mt-1" style={{ width: '100%', maxWidth: '140px', borderColor: game.cor_equipa2 }}>
                                            <div className="small fw-bold mb-1 text-muted" style={{ fontSize: '10px' }}>BANCO</div>
                                            <div className="d-flex justify-content-center gap-2 flex-wrap">
                                                {posicoesBanco.map((_, index) => {
                                                    const posId = `eq2-banco-${index}`;
                                                    const isOccupied = game.occupied_data?.positions?.includes(posId);
                                                    const isSelected = posicaoSelecionada?.id === posId;
                                                    return (
                                                        <div
                                                            key={posId}
                                                            onClick={() => !isOccupied && setPosicaoSelecionada({ id: posId, equipa: 2, tipo: 'banco', index })}
                                                            className="rounded-circle border border-2 transition-all"
                                                            style={{
                                                                width: '18px', height: '18px',
                                                                backgroundColor: isOccupied ? '#6c757d' : (isSelected ? game.cor_equipa2 : '#fff'),
                                                                borderColor: isOccupied ? '#495057' : game.cor_equipa2,
                                                                transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                                                                cursor: isOccupied ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            {isOccupied && <span className="d-block text-white fw-bold text-center" style={{ fontSize: '9px', lineHeight: '14px' }}>✕</span>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                                <span className="fw-bold fs-5">Vagas: <span className="text-danger border-bottom border-danger pb-1 px-2">{game.vagas}</span></span>
                                <Button
                                    color={(userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING') ? "success" : "danger"}
                                    className="w-100 fw-bold py-2 fs-5 rounded-3"
                                    disabled={userRegistrationStatus === 'APPROVED' || userRegistrationStatus === 'PENDING' || !posicaoSelecionada}
                                    onClick={handleInscrever}
                                >
                                    {userRegistrationStatus === 'APPROVED' ? 'CONFIRMADO' :
                                        userRegistrationStatus === 'PENDING' ? 'PENDENTE' :
                                            'Confirmar Lugar'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default MatchCard;