import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, Badge, Button } from 'reactstrap';
import { useUserContext } from '../context/UserProvider';

const HighlightCard = ({ highlight, author, onDelete }) => {
    const navigate = useNavigate();
    const { user } = useUserContext();
    const userId = Number(user?.player_id);

    // O Django devolve um array de IDs dos jogadores que deram like
    const initialLikes = highlight.likes || [];
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialLikes.includes(userId));

    if (!highlight || !author) return null;

    const getPic = (url) => {
        if (!url) return null;
        if (url.startsWith('/')) return `http://localhost:8000${url}`;
        return url;
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `Há ${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Há ${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `Há ${diffInDays}d`;
    };

    const handleToggleLike = async () => {
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikes(prev => wasLiked ? prev.filter(id => id !== userId) : [...prev, userId]);

        try {
            // Avisar a Base de Dados (Django)
            await axios.post(`http://localhost:8000/api/highlights/${highlight.id}/like/`, {}, {
                withCredentials: true,
                headers: { 'X-CSRFToken': getCSRFToken() }
            });
        } catch (error) {
            console.error("Erro ao dar like:", error);
            // Se o backend der erro, reverte a animação do coração
            setIsLiked(wasLiked);
            setLikes(wasLiked ? [...likes, userId] : likes.filter(id => id !== userId));
        }
    };

    const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    }

    return (
        <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
            {/* CABEÇALHO DO CARTÃO */}
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10">
                <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate(`/perfil/${author.id}`)}>
                    <div className="rounded-circle overflow-hidden bg-secondary me-3 border shadow-sm" style={{ width: '45px', height: '45px' }}>
                        {getPic(author.photo) ? (
                            <img src={getPic(author.photo)} alt="user" className="w-100 h-100 object-fit-cover"/>
                        ) : (
                            <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white fw-bold">
                                {author.username?.substring(0,2).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h6 className="fw-bold mb-0 text-dark">{author.username}</h6>
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>{author.first_name} {author.last_name}</small>
                    </div>
                </div>
                
                <div className="text-end d-flex align-items-center gap-3">
                    <div>
                        <small className="text-muted fw-bold d-block mb-1" style={{ fontSize: '11px' }}>{getTimeAgo(highlight.created_at)}</small>
                        <Badge color={highlight.modality === 'Futebol' ? 'success' : 'warning'} className="rounded-pill shadow-sm px-2" style={{ fontSize: '9px' }}>
                            {highlight.modality === 'Futebol' ? 'Futebol' : 'Basketball'}
                        </Badge>
                    </div>

                    {/* BOTÃO DE APAGAR (SÓ PARA O DONO) */}
                    {onDelete && (
                        <Button color="link" className="p-0 text-danger opacity-75 hover-opacity-100" onClick={() => onDelete(highlight.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.815 1.5L12 14.082a1 1 0 0 1-.997.918H4.885a1 1 0 0 1-.997-.918L3.185 4h9.63ZM5.5 5.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5Zm2 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5Zm2 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5Z"/>
                            </svg>
                        </Button>
                    )}
                </div>
            </div>

            {/* IMAGEM */}
            <div className="bg-dark" style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={getPic(highlight.image)} alt="Highlight" className="w-100" style={{ objectFit: 'contain', maxHeight: '400px' }} />
            </div>

            {/* RODAPÉ E LIKE */}
            <CardBody className="p-3">
                <div className="d-flex align-items-center mb-2">
                    <Button color="link" className="p-0 text-decoration-none d-flex align-items-center gap-2" onClick={handleToggleLike}>
                        {isLiked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#dc3545" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-dark" viewBox="0 0 16 16">
                                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 8 1.324 12.72-3.04 23.333 4.868 8 15z"/>
                            </svg>
                        )}
                        {/* Contador de Likes */}
                        {likes.length > 0 && <span className="fw-bold text-dark fs-6 ms-1">{likes.length}</span>}
                    </Button>
                </div>
                
                {highlight.description && (
                    <div className="text-dark small mt-1">
                        <span className="fw-bold me-2">{author.username}</span>
                        {highlight.description}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default HighlightCard;