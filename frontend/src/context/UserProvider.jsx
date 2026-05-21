import {createContext, useContext, useEffect, useRef, useState} from "react";
import axios from "axios";

const UserContext = createContext(null);

export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationAlert, setNotificationAlert] = useState({ message: '', type: 'info', isOpen: false });
    const latestNotificationIdRef = useRef(null);
    const notificationsInitializedRef = useRef(false);

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                // Vai ao Backend perguntar quem é o utilizador dono do Cookie atual
                const response = await axios.get("http://localhost:8000/api/user/");

                // Se o Django responder com sucesso (200 OK), guardamos os dados no Contexto
                setUser(response.data);
            } catch (error) {
                // Se der erro (ex: 403 Forbidden ou 401 Unauthorized), significa que o cookie expirou ou não existe
                setUser(null);
            } finally {
                // Quer tenha sucesso ou erro, terminamos a fase de "loading"
                setLoading(false);
            }
        };

        checkUserSession();
    }, []); // O array vazio garante que isto só corre 1 vez quando faço F5

    useEffect(() => {
        if (!user) return;

        refreshNotifications();
        const interval = setInterval(() => {
            refreshNotifications();
        }, 10000);

        return () => clearInterval(interval);
    }, [user]);

    const showAlert = (message, type = 'info', openAfter = false) => {
        setNotificationAlert({ message, type, isOpen: true });

        setTimeout(() => {
            setNotificationAlert(prev => ({ ...prev, isOpen: false }));
            if (openAfter) {
                setNotificationsOpen(true);
                markAllNotificationsRead();
            }
        }, 3000);
    };

    const hideAlert = () => {
        setNotificationAlert(prev => ({ ...prev, isOpen: false }));
    };

    const refreshNotifications = async () => {
        if (!user) return;
        try {
            const response = await axios.get("http://localhost:8000/api/notifications/", { withCredentials: true });
            const incoming = response.data;

            if (!notificationsInitializedRef.current) {
                setNotifications(incoming);
                notificationsInitializedRef.current = true;
                if (incoming.length > 0) {
                    latestNotificationIdRef.current = incoming[0].id;
                }
                return;
            }

            if (incoming.length > 0 && incoming[0].id !== latestNotificationIdRef.current) {
                const newNotification = incoming[0];
                latestNotificationIdRef.current = newNotification.id;
                setNotifications(incoming);
                showAlert(newNotification.message, newNotification.type || 'info', true);
            } else {
                setNotifications(incoming);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const addNotification = ({ message, type = 'info', category = 'Atualização', showAlert: showAlertToast = true, openAfterAlert = false }) => {
        const notification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
            message,
            type,
            category,
            createdAt: new Date().toISOString(),
            read: false,
        };

        setNotifications(prev => [notification, ...prev]);

        if (showAlertToast) {
            showAlert(message, type, openAfterAlert);
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            await axios.post("http://localhost:8000/api/notifications/mark-all-read/", {}, { withCredentials: true });
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const toggleNotifications = () => {
        setNotificationsOpen(prevOpen => {
            const nextOpen = !prevOpen;
            if (nextOpen) {
                markAllNotificationsRead();
            }
            return nextOpen;
        });
    };

    const openNotifications = () => {
        setNotificationsOpen(true);
        markAllNotificationsRead();
    };

    // Enquanto estiver a verificar o cookie, mostra apenas um ecrã branco ou um texto de loading (para evitar mostrar o ecrã de login mesmo quando o utilizador já tem sessão iniciada)
    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">A carregar...</span>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={{
            user,
            setUser,
            notifications,
            addNotification,
            notificationsOpen,
            toggleNotifications,
            openNotifications,
            markAllNotificationsRead,
            refreshNotifications,
            notificationAlert,
            showAlert,
            hideAlert,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;