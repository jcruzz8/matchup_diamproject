import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Input, Button, ListGroup, ListGroupItem, Badge, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useUserContext } from '../context/UserProvider.jsx';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';

const MessagesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUserContext();
    const userId = user?.player_id ? Number(user.player_id) : null;

    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [showMembersModal, setShowMembersModal] = useState(false);
    const messagesEndRef = useRef(null);

    const [inbox, setInbox] = useState([]);
    const [allMessages, setAllMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]); 

    // ESTADOS DO NOVO CHAT
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchFriend, setSearchFriend] = useState('');

    const fetchData = async () => {
        try {
            const [playersRes, teamsRes, messagesRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/players/'),
                axios.get('http://127.0.0.1:8000/api/teams/'),
                axios.get('http://127.0.0.1:8000/api/messages/')
            ]);

            const players = playersRes.data;
            const teams = teamsRes.data;
            const messages = messagesRes.data;

            setAllPlayers(players);
            setAllMessages(messages);

            const inboxMap = {};

            const updateInbox = (chatId, isTeam, chatData, msg) => {
                const key = isTeam ? `team_${chatId}` : `user_${chatId}`;
                if (!inboxMap[key]) {
                    inboxMap[key] = { ...chatData, unread: 0, lastMessage: '', time: '', timestamp: 0 };
                }
                if (msg) {
                    inboxMap[key].lastMessage = msg.text;
                    const d = new Date(msg.timestamp);
                    inboxMap[key].time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    inboxMap[key].timestamp = d.getTime();
                }
            };

            teams.forEach(team => {
                const isMember = team.members.includes(userId) || team.captain === userId || team.coach === userId;
                if (isMember) {
                    const membersData = players.filter(p => team.members.includes(p.id) || p.id === team.captain || p.id === team.coach).map(p => {
                        let role = 'Jogador';
                        let roleColor = 'secondary';
                        if(p.id === team.coach) { role = 'Treinador'; roleColor = 'dark'; }
                        else if(p.id === team.captain) { role = 'Capitão'; roleColor = 'danger'; }
                        return { id: p.id, username: p.username, name: `${p.first_name || ''} ${p.last_name || ''}`, role, roleColor };
                    });
                    updateInbox(team.id, true, {
                        id: team.id, username: team.name, name: team.name, isTeam: true, avatar: team.logo, members: membersData
                    }, null);
                }
            });

            messages.forEach(msg => {
                if (msg.team) {
                    updateInbox(msg.team, true, null, msg);
                } else {
                    const otherUserId = msg.sender === userId ? msg.receiver : msg.sender;
                    if (otherUserId) {
                        const otherUser = players.find(p => p.id === otherUserId);
                        if (otherUser) {
                            updateInbox(otherUserId, false, {
                                id: otherUser.id,
                                username: otherUser.username,
                                name: `${otherUser.first_name || ''} ${otherUser.last_name || ''}`,
                                isTeam: false,
                                avatar: otherUser.photo
                            }, msg);
                        }
                    }
                }
            });

            const inboxArray = Object.values(inboxMap).sort((a, b) => b.timestamp - a.timestamp);
            setInbox(inboxArray);

        } catch (error) {
            console.error("Erro ao carregar chat da BD:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const openChat = location.state?.openChat;
        if (!openChat || activeChat) return;

        const foundChat = inbox.find(c => c.id === openChat.id && c.isTeam === openChat.isTeam);
        if (foundChat) {
            setActiveChat(foundChat);
        } else {
            setActiveChat(openChat);
        }
    }, [location.state, inbox, activeChat]);

    useEffect(() => {
        if (!activeChat) return;
        
        const filtered = allMessages.filter(msg => {
            if (activeChat.isTeam) return msg.team === activeChat.id;
            return (msg.sender === userId && msg.receiver === activeChat.id) || (msg.sender === activeChat.id && msg.receiver === userId);
        });

        setChatHistory(filtered.map(msg => ({
            id: msg.id,
            sender_id: msg.sender,
            sender_name: msg.sender_name,
            text: msg.text,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
    }, [activeChat, allMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const payload = { text: newMessage };
        if (activeChat.isTeam) payload.team = activeChat.id;
        else payload.receiver = activeChat.id;

        try {
            setNewMessage('');
            const csrftoken = getCookie('csrftoken');
            await axios.post('http://127.0.0.1:8000/api/messages/', payload, {
                withCredentials: true,
                headers: { 'X-CSRFToken': csrftoken }
            });
            await fetchData();
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        }
    };

    {/* LÓGICA PARA INICIAR NOVA CONVERSA */}
    const currentUser = allPlayers.find(p => p.id === userId);
    // Inclui colegas, seguidos e seguidores para garantir que a pesquisa de amigos funcione
    const myFriendsIds = [...new Set([...(currentUser?.colegas || []), ...(currentUser?.following || []), ...(currentUser?.followers || [])])];
    const myFriends = allPlayers.filter(p => myFriendsIds.includes(p.id) && p.id !== userId);

    const filteredFriends = myFriends.filter(f => 
        f.username.toLowerCase().includes(searchFriend.toLowerCase()) || 
        `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase().includes(searchFriend.toLowerCase())
    );

    const handleStartNewChat = (friend) => {
        // Verifica se a conversa já existe na caixa de entrada
        const existingChat = inbox.find(c => !c.isTeam && c.id === friend.id);
        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            // Cria uma conversa visual temporária (que é guardada mal envies a 1ª msg)
            const newChat = {
                id: friend.id,
                username: friend.username,
                name: `${friend.first_name || ''} ${friend.last_name || ''}`,
                isTeam: false,
                avatar: friend.photo,
                lastMessage: '',
                time: '',
                unread: 0
            };
            setInbox([newChat, ...inbox]);
            setActiveChat(newChat);
        }
        setShowNewChatModal(false);
        setSearchFriend(''); // Limpa a pesquisa
    };

    return (
        <div className="bg-light vh-100 d-flex flex-column" style={{ paddingTop: '56px', paddingBottom: '65px' }}>
            <div className="fixed-top w-100" style={{ zIndex: 1050 }}>
                <TopNavBarSimple />
            </div>

            <Container fluid className="flex-grow-1 overflow-hidden px-0 h-100">
                <Row className="h-100 g-0">
                    
                    {/* COLUNA ESQUERDA: LISTA DE CONVERSAS */}
                    <Col xs={12} md={4} lg={3} className={`bg-white border-end h-100 flex-column ${activeChat ? 'd-none d-md-flex' : 'd-flex'}`}>
                        <div className="px-3 border-bottom d-flex justify-content-between align-items-center shadow-sm z-1 bg-white" style={{ height: '70px' }}>
                            <h4 className="fw-bold m-0 text-dark">Mensagens</h4>
                            <Button 
                                color="danger" 
                                outline 
                                size="sm" 
                                className="rounded-circle fw-bold border-2 d-flex justify-content-center align-items-center" 
                                style={{width: '35px', height: '35px'}}
                                onClick={() => setShowNewChatModal(true)}
                            >
                                +
                            </Button>
                        </div>
                        
                        <div className="overflow-auto flex-grow-1" style={{ backgroundColor: '#f8f9fa' }}>
                            <ListGroup flush className="bg-transparent">
                                {inbox.map(chat => (
                                    <ListGroupItem 
                                        key={chat.isTeam ? `t${chat.id}` : `u${chat.id}`} 
                                        action 
                                        tag="button"
                                        onClick={() => setActiveChat(chat)}
                                        className={`d-flex justify-content-between align-items-center py-3 border-bottom cursor-pointer ${activeChat?.id === chat.id && activeChat?.isTeam === chat.isTeam ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}
                                    >
                                        <div className="d-flex align-items-center overflow-hidden">
                                            <div className={`rounded-circle overflow-hidden me-3 border flex-shrink-0 position-relative ${chat.isTeam ? 'bg-dark' : 'bg-secondary'}`} style={{ width: '50px', height: '50px' }}>
                                                {chat.avatar ? (
                                                    <img src={chat.isTeam ? `http://127.0.0.1:8000${chat.avatar}` : (chat.avatar.startsWith('/') ? `http://127.0.0.1:8000${chat.avatar}` : chat.avatar)} alt="user" className="w-100 h-100 object-fit-cover"/>
                                                ) : (
                                                    <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white fw-bold">{chat.username.substring(0,2).toUpperCase()}</div>
                                                )}
                                                {!chat.isTeam && <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style={{ width: '12px', height: '12px' }}></span>}
                                            </div>
                                            <div className="text-truncate">
                                                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                                    {chat.username}
                                                    {chat.isTeam && <Badge color="danger" style={{fontSize: '9px'}}>EQUIPA</Badge>}
                                                </h6>
                                                <small className={`text-truncate d-block ${chat.unread > 0 ? 'fw-bold text-dark' : 'text-muted'}`} style={{ maxWidth: '180px' }}>
                                                    {chat.lastMessage || <span className="fst-italic text-black-50">Iniciar conversa...</span>}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="text-end ms-2 d-flex flex-column align-items-end">
                                            <small className={chat.unread > 0 ? 'text-danger fw-bold' : 'text-muted'} style={{ fontSize: '11px' }}>{chat.time}</small>
                                        </div>
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        </div>
                    </Col>


                    {/* COLUNA DIREITA: CHAT ATIVO */}
                    <Col xs={12} md={8} lg={9} className={`h-100 position-relative flex-column ${!activeChat ? 'd-none d-md-flex' : 'd-flex'}`} style={{ backgroundColor: '#f0f2f5' }}>
                        
                        {!activeChat ? (
                            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-4">
                                <div className="rounded-circle bg-danger bg-opacity-10 d-flex justify-content-center align-items-center mb-3 shadow-sm border border-danger border-opacity-25" style={{ width: '100px', height: '100px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                                        <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-2.316.815-5.228 1.067-5.228 1.067s.536-1.461.815-2.84C.45 12.164 0 10.36 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                                    </svg>
                                </div>
                                <h4 className="fw-bold text-dark">Comece a conversar</h4>
                                <p className="text-muted">Selecione uma conversa ao lado para combinar a próxima partida.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white border-bottom shadow-sm px-3 d-flex align-items-center z-1 w-100" style={{ height: '70px' }}>
                                    <Button color="link" className="text-dark p-0 me-3 d-md-none" onClick={() => setActiveChat(null)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                                        </svg>
                                    </Button>
                                    
                                    <div className="d-flex align-items-center cursor-pointer" onClick={() => activeChat.isTeam ? setShowMembersModal(true) : navigate(`/perfil/${activeChat.id}`)}>
                                        <div className={`rounded-circle overflow-hidden me-3 shadow-sm border ${activeChat.isTeam ? 'bg-dark' : 'bg-secondary'}`} style={{ width: '45px', height: '45px' }}>
                                            {activeChat.avatar ? (
                                                <img src={activeChat.isTeam ? `http://127.0.0.1:8000${activeChat.avatar}` : (activeChat.avatar.startsWith('/') ? `http://127.0.0.1:8000${activeChat.avatar}` : activeChat.avatar)} alt="user" className="w-100 h-100 object-fit-cover"/>
                                            ) : (
                                                <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white fw-bold">{activeChat.username.substring(0,2).toUpperCase()}</div>
                                            )}
                                        </div>
                                        <div>
                                            <h6 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                                                {activeChat.username}
                                                {activeChat.isTeam && <Badge color="danger" style={{fontSize: '9px'}}>EQUIPA</Badge>}
                                            </h6>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                                {activeChat.isTeam ? 'Ver membros do grupo 👥' : 'Online agora'}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-grow-1 overflow-auto p-4 position-relative" style={{ paddingBottom: '20px' }}>
                                    {chatHistory.length === 0 && (
                                        <div className="text-center mt-5 text-muted small">Nenhuma mensagem. Seja o primeiro a dizer olá! 👋</div>
                                    )}

                                    {chatHistory.map(msg => {
                                        const isMine = msg.sender_id === userId;
                                        return (
                                            <div key={msg.id} className={`d-flex mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                                <div className={`p-3 shadow-sm ${isMine ? 'bg-danger text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '75%', borderRadius: isMine ? '15px 15px 0px 15px' : '15px 15px 15px 0px' }}>
                                                    {activeChat.isTeam && !isMine && (
                                                        <div className="fw-bold text-danger mb-1" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                                                            @{msg.sender_name}
                                                        </div>
                                                    )}
                                                    <div className="mb-1" style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                                                    <div className={`text-end fw-bold ${isMine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '10px' }}>
                                                        {msg.time}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="bg-white border-top p-3 z-1 shadow-sm">
                                    <form onSubmit={handleSendMessage} className="d-flex align-items-center">
                                        <Input 
                                            type="text" 
                                            placeholder="Escreve uma mensagem..." 
                                            className="rounded-pill bg-light border border-secondary border-opacity-25 shadow-none ps-4 py-2 flex-grow-1"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <Button type="submit" color="danger" className="rounded-circle ms-2 shadow-sm d-flex justify-content-center align-items-center" style={{ width: '45px', height: '45px', flexShrink: 0 }} disabled={!newMessage.trim()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="ms-1" viewBox="0 0 16 16">
                                                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                                            </svg>
                                        </Button>
                                    </form>
                                </div>
                            </>
                        )}
                    </Col>
                </Row>
            </Container>

            <BottomNavBar />

            {/* MODAL DOS MEMBROS DA EQUIPA */}
            <Modal isOpen={showMembersModal} toggle={() => setShowMembersModal(false)} centered className="rounded-4">
                <ModalHeader toggle={() => setShowMembersModal(false)} className="border-0 pb-0">
                    <span className="fw-bold text-dark">Membros de {activeChat?.username}</span>
                </ModalHeader>
                <ModalBody className="pt-3">
                    <ListGroup flush>
                        {activeChat?.isTeam && activeChat.members?.map(member => (
                            <ListGroupItem key={member.id} className="d-flex justify-content-between align-items-center px-0 py-3 border-secondary border-opacity-10 bg-transparent">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-secondary bg-opacity-25 me-3 d-flex justify-content-center align-items-center fw-bold text-dark border" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                                        {member.username.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0 text-dark" style={{fontSize: '14px'}}>{member.name}</h6>
                                        <small className="text-muted" style={{fontSize: '11px'}}>@{member.username}</small>
                                    </div>
                                </div>
                                <Badge color={member.roleColor} className="rounded-pill px-2 py-1 shadow-sm" style={{fontSize: '10px'}}>
                                    {member.role}
                                </Badge>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </ModalBody>
            </Modal>

            {/* MODAL DE PROCURAR AMIGOS */}
            <Modal isOpen={showNewChatModal} toggle={() => setShowNewChatModal(false)} centered className="rounded-4">
                <ModalHeader toggle={() => { setShowNewChatModal(false); setSearchFriend(''); }} className="border-0 pb-0">
                    <span className="fw-bold text-dark">Nova Mensagem</span>
                </ModalHeader>
                <ModalBody className="pt-3">
                    
                    <Input 
                        type="text" 
                        placeholder="Pesquisar amigos..." 
                        className="rounded-pill bg-light border-0 shadow-sm px-4 py-2 mb-3"
                        value={searchFriend}
                        onChange={(e) => setSearchFriend(e.target.value)}
                        autoFocus
                    />

                    {/* Condição Restrita: Se a barra estiver vazia OU não houver amigos que combinem com o nome */}
                    {searchFriend.trim() === '' || filteredFriends.length === 0 ? (
                        <div className="text-center py-4">
                            <div className="rounded-circle bg-danger bg-opacity-10 d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                                </svg>
                            </div>
                            <h6 className="fw-bold text-dark mb-1">Não foram encontrados amigos para conversar.</h6>
                            <p className="text-muted small mb-4">Adiciona novos colegas na comunidade para começares a falar.</p>
                            
                            <Button color="danger" outline className="rounded-pill fw-bold shadow-sm px-4" onClick={() => { setShowNewChatModal(false); navigate('/comunidade'); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2 mb-1" viewBox="0 0 16 16">
                                    <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/>
                                </svg>
                                Ir para a Comunidade
                            </Button>
                        </div>
                    ) : (
                        <ListGroup flush className="overflow-auto" style={{ maxHeight: '250px' }}>
                            {filteredFriends.map(friend => (
                                <ListGroupItem 
                                    key={friend.id} 
                                    action 
                                    tag="button" 
                                    className="d-flex align-items-center px-0 py-2 border-secondary border-opacity-10 bg-transparent"
                                    onClick={() => handleStartNewChat(friend)}
                                >
                                    <div className="rounded-circle overflow-hidden bg-secondary me-3 d-flex justify-content-center align-items-center text-white fw-bold shadow-sm" style={{ width: '45px', height: '45px' }}>
                                        {friend.photo ? (
                                            <img src={friend.photo.startsWith('/') ? `http://127.0.0.1:8000${friend.photo}` : friend.photo} alt="user" className="w-100 h-100 object-fit-cover"/>
                                        ) : (
                                            friend.username.substring(0,2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="fw-bold m-0 text-dark">{friend.username}</h6>
                                        <small className="text-muted">{friend.first_name} {friend.last_name}</small>
                                    </div>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default MessagesPage;