import { useNavigate } from 'react-router-dom';
import { Button } from 'reactstrap';
import ProfileDropdown from './ProfileDropdown';
import NotificationSidebar from './NotificationSidebar';
import AppAlert from './AppAlert';
import { useUserContext } from '../context/UserProvider.jsx';

const TopNavBarToggle = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const {user} = useUserContext();
    const { notifications, toggleNotifications, notificationAlert, hideAlert } = useUserContext();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <div className="bg-white border-bottom sticky-top shadow-sm px-3 py-2 d-flex justify-content-between align-items-center z-3">
            
            {/* LADO ESQUERDO: Mensagens e Notificações */}
            <div className="d-flex align-items-center gap-3" style={{ width: '100px' }}>
                {/* Botão de Mensagens */}
                <Button 
                    color="link" 
                    className="text-dark p-0 position-relative d-flex align-items-center" 
                    onClick={() => navigate('/mensagens')}
                    style={{ shadow: 'none', textDecoration: 'none' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-2.316.815-5.228 1.067-5.228 1.067s.536-1.461.815-2.84C.45 12.164 0 10.36 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '9px', height: '9px' }}></span>
                </Button>

                {/* Ícone de Notificações (Coração) */}
                {user? (
                    <div className="position-relative cursor-pointer text-dark" onClick={toggleNotifications} style={{ width: '24px', height: '24px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                        </svg>
                        {unreadCount > 0 ? (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white" style={{ minWidth: '16px', height: '16px', fontSize: '10px' }}>
                                {unreadCount}
                            </span>
                        ) : (
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '9px', height: '9px' }}></span>
                        )}
                    </div>
                ):(<div/>)}
            </div>

            {/* CENTRO: Switch */}
            <div className="d-flex bg-light rounded-pill p-1 shadow-sm border justify-content-center" style={{ width: '180px' }}>
                <button 
                    className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'match' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`}
                    onClick={() => setActiveTab('match')}
                >
                    Match's
                </button>
                <button 
                    className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'highlights' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`}
                    onClick={() => setActiveTab('highlights')}
                >
                    Highlights
                </button>
            </div>

            {/* LADO DIREITO: Perfil */}
            {user? (<div className="d-flex justify-content-end" style={{ width: '100px' }}>
                        <ProfileDropdown />
                    </div>):(
                    <div className="d-flex align-items-center">
                         <Button color="danger" className="fw-bold px-4" onClick={() => navigate('/login')}>
                            Iniciar Sessão
                        </Button>
                    </div>
            )}
            
        </div>

            <AppAlert {...notificationAlert} toggle={hideAlert} />
            <NotificationSidebar />
        </>
    );
};

export default TopNavBarToggle;