import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

const UserContext = createContext(null);

export const useUserContext = () => useContext(UserContext);

const getCSRFToken = () => {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    }

const UserProvider = ({ children }) => {
    // Estados
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationAlert, setNotificationAlert] = useState({ message: '', type: 'info', isOpen: false });

    const latestNotificationIdRef = useRef(null);
    const notificationsInitializedRef = useRef(false);

    const [followingList, setFollowingList] = useState([]);

    const refreshFollowing = async () => {
        if (!user) return;
        try {
            const res = await axios.get('http://localhost:8000/api/my-following/', { withCredentials: true });
            setFollowingList(res.data); // Assumindo que a API retorna [id1, id2, ...]
        } catch (err) {
            console.error("Erro ao carregar seguimentos:", err);
        }
    };

    useEffect(() => {
        if (user) refreshFollowing();
    }, [user]);

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const response = await axios.get("http://localhost:8000/api/user/", { withCredentials: true });
                setUser(response.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUserSession();
    }, []);

    useEffect(() => {
        if (!user) return;
        refreshNotifications();
        const interval = setInterval(refreshNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const showAlert = (message, type = 'info', openAfter = false) => {
        setNotificationAlert({ message, type, isOpen: true });
        setTimeout(() => {
            setNotificationAlert(prev => ({ ...prev, isOpen: false }));
            if (openAfter) {
                setNotificationsOpen(true);
                markAllRead();
            }
        }, 3000);
    };

    const hideAlert = () => setNotificationAlert(prev => ({ ...prev, isOpen: false }));

    const refreshNotifications = async () => {
        if (!user) return;
        try {
            const response = await axios.get("http://localhost:8000/api/notifications/", { withCredentials: true });
            const incoming = response.data;

            if (!notificationsInitializedRef.current) {
                setNotifications(incoming);
                notificationsInitializedRef.current = true;
                if (incoming.length > 0) latestNotificationIdRef.current = incoming[0].id;
                return;
            }

            if (incoming.length > 0 && incoming[0].id !== latestNotificationIdRef.current) {
                latestNotificationIdRef.current = incoming[0].id;
                setNotifications(incoming);
                showAlert(incoming[0].message, incoming[0].type || 'info', true);
            } else {
                setNotifications(incoming);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('http://localhost:8000/api/notifications/mark-all-read/', {}, {
                withCredentials: true,
                headers: { 'X-CSRFToken': getCSRFToken() }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
        }
    };

    const toggleNotifications = () => {
        setNotificationsOpen(prevOpen => {
            if (!prevOpen) markAllRead();
            return !prevOpen;
        });
    };

    const openNotifications = () => {
        setNotificationsOpen(true);
        markAllRead();
    };

    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">A carregar...</span>
                </div>
            </div>
        );
    }

    // Criamos o objeto de contexto aqui para garantir que o IDE lê tudo perfeitamente
    const contextValue = {
        user,
        setUser,
        notifications,
        notificationsOpen,
        setNotificationsOpen,
        toggleNotifications,
        openNotifications,
        markAllRead,
        followingList,
        refreshFollowing,
        refreshNotifications,
        notificationAlert,
        showAlert,
        hideAlert,
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;