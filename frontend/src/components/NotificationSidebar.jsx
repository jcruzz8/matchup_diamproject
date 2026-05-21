import { useState } from 'react';
import axios from 'axios';
import { Button } from 'reactstrap';
import { useUserContext } from '../context/UserProvider.jsx';

const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

const NotificationSidebar = () => {
    const {
        notificationsOpen,
        toggleNotifications,
        notifications,
        markAllNotificationsRead,
        refreshNotifications,
        showAlert,
    } = useUserContext();
    const [processingId, setProcessingId] = useState(null);

    if (!notificationsOpen) {
        return null;
    }

    const total = notifications.length;
    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationTitle = (notification) => {
        if (notification.reference_type === 'FOLLOW_REQUEST') return 'Novo Pedido para seguir';
        if (notification.reference_type === 'TEAM_JOIN_REQUEST') return 'Pedido para entrar na equipa';
        return notification.category || 'Atualização';
    };

    const handleAction = async (notification, action) => {
        if (!notification.reference_type) return;
        setProcessingId(notification.id);
        try {
            const csrftoken = getCookie('csrftoken');
            const res = await axios.post(
                `http://localhost:8000/api/notifications/${notification.id}/action/`,
                { action },
                {
                    withCredentials: true,
                    headers: { 'X-CSRFToken': csrftoken }
                }
            );
            showAlert(res.data.message, action === 'accept' ? 'success' : 'danger');
            await refreshNotifications();
        } catch (error) {
            console.error('Erro ao processar notificação:', error);
            showAlert(error.response?.data?.error || 'Erro ao processar a notificação.', 'danger');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <div
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25"
                style={{ zIndex: 1090 }}
                onClick={toggleNotifications}
            />
            <div
                className="position-fixed top-0 start-0 h-100 bg-white shadow-lg border-end overflow-hidden"
                style={{ width: '340px', zIndex: 1100 }}
            >
                <div className="d-flex align-items-center justify-content-between border-bottom py-3 px-3">
                    <div>
                        <h6 className="mb-0 fw-bold">Notificações</h6>
                        <small className="text-muted">{total} totais · {unreadCount} não lidas</small>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        {total > 0 && (
                            <Button color="link" size="sm" className="text-decoration-none p-0" onClick={markAllNotificationsRead}>
                                Marcar todas
                            </Button>
                        )}
                        <Button color="link" size="sm" className="text-dark p-0" onClick={toggleNotifications}>
                            Fechar
                        </Button>
                    </div>
                </div>
                <div className="p-3" style={{ maxHeight: 'calc(100vh - 86px)', overflowY: 'auto' }}>
                    {total === 0 ? (
                        <div className="text-center text-muted py-5">
                            Não há notificações por agora.
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`rounded-4 border p-3 mb-3 ${notification.read ? 'bg-light border-secondary' : 'bg-white border-danger'}`}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div className="fw-bold text-dark">{getNotificationTitle(notification)}</div>
                                        <small className="text-muted">{notification.type === 'danger' ? 'Urgente' : 'Nova'}</small>
                                    </div>
                                    <div className="text-end">
                                        <small className="text-muted d-block">{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        {!notification.read && <span className="badge bg-danger mt-1">Novo</span>}
                                    </div>
                                </div>

                                {['FOLLOW_REQUEST', 'TEAM_JOIN_REQUEST'].includes(notification.reference_type) ? (
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        {notification.actor_photo ? (
                                            <img
                                                src={notification.actor_photo}
                                                alt={notification.actor_username}
                                                className="rounded-circle"
                                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px' }}>
                                                {notification.actor_username ? notification.actor_username.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                        <div className="flex-grow-1">
                                            <div className="fw-bold text-dark">{notification.actor_username || 'Utilizador'}</div>
                                            <div className="text-muted" style={{ fontSize: '13px' }}>{notification.message}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mb-3 text-dark" style={{ lineHeight: 1.5 }}>{notification.message}</p>
                                )}

                                {['FOLLOW_REQUEST', 'TEAM_JOIN_REQUEST'].includes(notification.reference_type) && (
                                    <div className="d-flex gap-2">
                                        <Button
                                            color="success"
                                            size="sm"
                                            className="rounded-pill flex-fill"
                                            disabled={processingId === notification.id}
                                            onClick={() => handleAction(notification, 'accept')}
                                        >
                                            Aceitar
                                        </Button>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            className="rounded-pill flex-fill"
                                            disabled={processingId === notification.id}
                                            onClick={() => handleAction(notification, 'reject')}
                                        >
                                            Recusar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationSidebar;
