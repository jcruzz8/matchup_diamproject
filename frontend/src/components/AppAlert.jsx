import { Alert } from 'reactstrap';

const AppAlert = ({ message, type, isOpen, toggle }) => {
    return (
        <Alert
            color={type}
            isOpen={isOpen}
            toggle={toggle}
            fade={true}
            className="fixed-top mt-3 shadow-lg mx-auto rounded-4 border-0"
            style={{ width: '90%', maxWidth: '420px', zIndex: 9999 }}
        >
            <div className="d-flex align-items-center gap-2">
                <span className="fs-5">{type === 'success' ? '✅' : type === 'danger' ? '⚠️' : '🔔'}</span>
                <span>{message}</span>
            </div>
        </Alert>
    );
};
export default AppAlert;