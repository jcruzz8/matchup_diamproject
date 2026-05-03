import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const TopNavBarSimple = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border-bottom sticky-top shadow-sm px-3 py-2 d-flex justify-content-between align-items-center z-3">
            <div className="d-flex align-items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="cursor-pointer" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                </svg>
                <div className="position-relative cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                    </svg>
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                </div>
            </div>

            <h4 className="m-0 fw-bold text-danger fst-italic cursor-pointer" onClick={() => navigate('/')}>Match Up</h4>

            <ProfileDropdown />
        </div>
    );
};
export default TopNavBarSimple;