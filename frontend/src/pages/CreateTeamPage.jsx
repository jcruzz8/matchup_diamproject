import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, CardBody, FormGroup, Label, Input, Button, Alert, Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import {useUserContext} from "../context/UserProvider.jsx";

const CreateTeamPage = () => {
const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Extrair o utilizador do contexto
    const { user } = useUserContext();

    // Garantir que o ID é um número seguro
    const userId = Number(user?.player_id);

    // Estados do Formulário
    const [teamName, setTeamName] = useState('');
    const [modality, setModality] = useState('Futsal');
    const [city, setCity] = useState('');
    const [logo, setLogo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Estados do Treinador e Amigos
    const [coach, setCoach] = useState(null);
    const [myFriends, setMyFriends] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const fetchUserData = async () => {
        try {
            const resPlayer = await axios.get(`http://localhost:8000/api/players/${userId}/`);
            setCurrentUser(resPlayer.data);

            if (resPlayer.data.colegas && resPlayer.data.colegas.length > 0) {
                const friendsData = await Promise.all(
                    resPlayer.data.colegas.map(friendId =>
                        axios.get(`http://localhost:8000/api/players/${friendId}/`).then(res => res.data)
                    )
                );
                setMyFriends(friendsData);
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    // Função para o upload da imagem
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            // Cria um URL temporário para mostrar a pré-visualização
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        
        if (!teamName.trim()) {
            setAlertConfig({ show: true, message: 'O nome da equipa é obrigatório!', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', teamName);
        formData.append('modality', modality);
        formData.append('city', city);
        formData.append('captain', userId);
        if (coach) {
            formData.append('coach', coach.id);
        }
        if (logo) {
            formData.append('logo', logo);
        }

        try {
            await axios.post('http://localhost:8000/api/teams/', formData, {
                headers: { 'X-CSRFToken':getCSRFToken(),'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setAlertConfig({ show: true, message: 'Equipa criada com sucesso!', color: 'success' });
            setTimeout(() => navigate('/'), 2000);

        } catch (error) {
            console.error("Erro ao criar equipa:", error);
            setAlertConfig({ show: true, message: 'Erro ao criar equipa. Verifica os dados.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            setIsSubmitting(false);
        }
    };

    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    }

    const getProfilePic = (player) => {
        if (!player) return null;
        let picUrl = player.photo || player.image || player.profile_picture;
        if (picUrl && picUrl.startsWith('/')) return `http://localhost:8000${picUrl}`;
        return picUrl;
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            <Container className="pt-4 pb-5 mb-4">
                <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-5">
                    <CardBody className="p-4 p-md-5">
                        <div className="d-flex align-items-center justify-content-between gap-3 mb-4" style={{ minHeight: '42px' }}>
                            <Button color="link" className="text-dark p-0" onClick={() => navigate(-1)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                                </svg>
                            </Button>
                            <div className="flex-grow-1 text-center">
                                <h3 className="fw-bold m-0 text-dark">Criar Nova Equipa</h3>
                                <p className="text-muted small mb-0">Reúne os teus amigos e domina os campos!</p>
                            </div>
                            <div style={{ width: '36px' }} />
                        </div>
                        <form onSubmit={handleCreateTeam}>
                            
                            {/* PRÉ-VISUALIZAÇÃO DA FOTO */}
                            <div className="d-flex flex-column align-items-center mb-4">
                                <div 
                                    className="rounded-circle bg-secondary bg-opacity-25 d-flex justify-content-center align-items-center overflow-hidden border border-2 border-dark cursor-pointer position-relative shadow-sm" 
                                    style={{ width: '120px', height: '120px' }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="text-center text-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="mb-1" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                                            <div className="small fw-bold">Add Logo</div>
                                        </div>
                                    )}
                                    {/* Input de ficheiro escondido */}
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="d-none" />
                                </div>
                            </div>

                            <FormGroup className="mb-4">
                                <Label className="fw-bold small text-muted text-uppercase">Nome da Equipa</Label>
                                <Input type="text" placeholder="Ex: Galácticos FC" className="form-control-lg border-2 bg-light shadow-none fw-bold text-dark" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                            </FormGroup>

                            <FormGroup className="mb-4">
                                <Label className="fw-bold small text-muted text-uppercase">Modalidade Principal</Label>
                                <Input type="select" className="form-control-lg border-2 bg-light shadow-none fw-bold" value={modality} onChange={(e) => setModality(e.target.value)}>
                                    <option value="Futebol">Futebol</option>
                                    <option value="Basketball">Basketball</option>
                                </Input>
                            </FormGroup>

                            <FormGroup className="mb-4">
                                <Label className="fw-bold small text-muted text-uppercase">Zona Base</Label>
                                <Input type="text" placeholder="Ex: Lisboa" className="form-control-lg border-2 bg-light shadow-none" value={city} onChange={(e) => setCity(e.target.value)} />
                            </FormGroup>

                            {/* SELEÇÃO DE TREINADOR */}
                            <FormGroup className="mb-5">
                                <Label className="fw-bold small text-muted text-uppercase">Treinador (Opcional)</Label>
                                <div 
                                    className="d-flex justify-content-between align-items-center p-3 border-2 border rounded-3 bg-light cursor-pointer"
                                    onClick={() => setIsCoachModalOpen(true)}
                                >
                                    <div className="d-flex align-items-center">
                                        {coach ? (
                                            <>
                                                <div className="rounded-circle overflow-hidden bg-secondary me-3" style={{ width: '40px', height: '40px' }}>
                                                    {getProfilePic(coach) ? (
                                                        <img src={getProfilePic(coach)} alt={coach.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg></div>
                                                    )}
                                                </div>
                                                <span className="fw-bold fs-5">{coach.username}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted fw-bold">Escolher um Treinador...</span>
                                        )}
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-secondary" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>
                                </div>
                            </FormGroup>

                            <Button type="submit" className="btn-custom-red w-100 py-3 fw-bold fs-5 rounded-3 shadow-sm" disabled={isSubmitting}>
                                {isSubmitting ? 'A criar...' : 'Registar Equipa'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </Container>

            <BottomNavBar />

            {/* MODAL DE ESCOLHER TREINADOR */}
            <Modal isOpen={isCoachModalOpen} toggle={() => setIsCoachModalOpen(!isCoachModalOpen)} centered scrollable>
                <ModalHeader toggle={() => setIsCoachModalOpen(!isCoachModalOpen)} className="fw-bold text-dark border-bottom-0 pb-0">
                    Selecionar Treinador
                </ModalHeader>
                <ModalBody className="pt-2">
                    <p className="text-muted small mb-3">Podes atribuir-te a ti próprio ou a um dos teus colegas (amigos mútuos).</p>
                    
                    <ListGroup className="rounded-3 shadow-sm border-0">
                        {/* OPÇÃO 1: O PRÓPRIO UTILIZADOR */}
                        {currentUser && (
                            <ListGroupItem 
                                tag="button" 
                                action 
                                active={coach?.id === currentUser.id}
                                onClick={() => { setCoach(currentUser); setIsCoachModalOpen(false); }}
                                className={`d-flex align-items-center py-3 border-secondary border-opacity-25 ${coach?.id === currentUser.id ? 'bg-danger border-danger text-white' : ''}`}
                            >
                                <div className="rounded-circle overflow-hidden bg-secondary me-3 shadow-sm" style={{ width: '45px', height: '45px' }}>
                                    {getProfilePic(currentUser) ? (
                                        <img src={getProfilePic(currentUser)} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg></div>
                                    )}
                                </div>
                                <div>
                                    <div className="fw-bold fs-5">{currentUser.username}</div>
                                    <small className={coach?.id === currentUser.id ? 'text-white text-opacity-75' : 'text-muted'}>Eu próprio</small>
                                </div>
                            </ListGroupItem>
                        )}

                        {/* LISTA DE AMIGOS */}
                        {myFriends.map(friend => (
                            <ListGroupItem 
                                key={friend.id}
                                tag="button" 
                                action 
                                active={coach?.id === friend.id}
                                onClick={() => { setCoach(friend); setIsCoachModalOpen(false); }}
                                className={`d-flex align-items-center py-3 border-secondary border-opacity-25 ${coach?.id === friend.id ? 'bg-danger border-danger text-white' : ''}`}
                            >
                                <div className="rounded-circle overflow-hidden bg-secondary me-3 shadow-sm" style={{ width: '45px', height: '45px' }}>
                                    {getProfilePic(friend) ? (
                                        <img src={getProfilePic(friend)} alt={friend.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg></div>
                                    )}
                                </div>
                                <div className="fw-bold fs-5">{friend.username}</div>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                    
                    {/* BOTÃO PARA REMOVER TREINADOR */}
                    {coach && (
                        <div className="text-center mt-3">
                            <Button color="link" className="text-danger fw-bold text-decoration-none" onClick={() => { setCoach(null); setIsCoachModalOpen(false); }}>
                                Remover Treinador
                            </Button>
                        </div>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default CreateTeamPage;