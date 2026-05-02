import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const CreateMenuPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const toggleProfile = () => setProfileDropdownOpen((prevState) => !prevState);

    useEffect(() => {
        const storedUsername = localStorage.getItem('matchup_username');
        if (storedUsername) setUsername(storedUsername);
    }, []);

    const handleLogout = () => {
        console.log("Logout iniciado");
        localStorage.removeItem('matchup_user_id');
        localStorage.removeItem('matchup_username');
        window.location.href = '/landing';
    };

    return (
        <div className="landing-bg min-vh-100 pb-5 d-flex flex-column">
            
            {/* BARRA SUPERIOR */}
            <div className="bg-white border-bottom sticky-top shadow-sm px-3 py-2 d-flex justify-content-between align-items-center">
                
                <div className="d-flex align-items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="cursor-pointer" viewBox="0 0 16 16">
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                    </svg>
                    <div className="position-relative cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                        </svg>
                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                    </div>
                </div>

                <h4 className="text-center w-100 text-danger fw-bold py-2">MATCH UP</h4>

                <Dropdown isOpen={profileDropdownOpen} toggle={toggleProfile}>
                    <DropdownToggle tag="div" className="cursor-pointer">
                        <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center" style={{ width: '35px', height: '35px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-white" viewBox="0 0 16 16">
                                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                            </svg>
                        </div>
                    </DropdownToggle>
                    
                    {profileDropdownOpen && (
                        <div className="position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 bg-white" style={{ minWidth: '260px', zIndex: 1050 }} onClick={(e) => e.stopPropagation()}>
                            <div className="p-3">
                                <div className="fw-bold fs-6 text-dark pb-0">{username}</div>
                                <div className="border-bottom my-2" />
                                <div className="text-muted small text-uppercase fw-bold pt-0">Próximos Match</div>
                                <div className="px-0 pb-2">
                                    <div className="p-2 border rounded-3 bg-light border-start border-4 border-danger cursor-pointer mb-2">
                                        <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Futebol - Pavilhão da Luz</h6>
                                        <small className="text-muted" style={{ fontSize: '12px' }}>Sexta-feira • 21:00</small>
                                    </div>
                                </div>
                                <div className="border-bottom my-2" />
                                <button type="button" className="btn btn-link text-start w-100 py-2">Ver Perfil</button>
                                <button type="button" className="btn btn-link text-start w-100 py-2">Editar Perfil</button>
                                <button type="button" onMouseDown={() => navigate('/organizar')} className="btn btn-link text-start w-100 py-2">Organizar Os Meus Match</button>
                                <div className="border-bottom my-2" />
                                <button type="button" onMouseDown={handleLogout} className="btn btn-link text-start w-100 text-danger fw-bold py-2">Sair do Perfil</button>
                            </div>
                        </div>
                    )}
                </Dropdown>
            </div>

            {/* CENTRAL */}
            <Container className="flex-grow-1 d-flex align-items-center justify-content-center pt-4 pb-5">
                <Row className="w-100 justify-content-center">
                    <Col xs={12} md={8} lg={5}>
                        <h4 className="text-center w-100 text-danger fw-bold py-2">O que pretendes criar?</h4>
                        
                        <Card className="shadow-lg border-0 rounded-4 mb-3 cursor-pointer" onClick={() => navigate('/criar/equipa')} style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <CardBody className="d-flex align-items-center p-4">
                                <div className="bg-dark text-white rounded-circle p-3 me-3 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">Nova Equipa</h5>
                                    <span className="text-muted small">Junta os teus amigos e cria um plantel</span>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="shadow-lg border-0 rounded-4 mb-3 cursor-pointer" onClick={() => navigate('/criar/jogo')} style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <CardBody className="d-flex align-items-center p-4">
                                <div className="bg-danger text-white rounded-circle p-3 me-3 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">Novo Match</h5>
                                    <span className="text-muted small">Agenda um match e convida a comunidade</span>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="shadow-lg border-0 rounded-4 cursor-pointer" onClick={() => navigate('/criar/publicacao')} style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <CardBody className="d-flex align-items-center p-4">
                                <div className="bg-secondary text-white rounded-circle p-3 me-3 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">Nova Publicação</h5>
                                    <span className="text-muted small">Partilha fotos, vídeos ou highlights do jogo</span>
                                </div>
                            </CardBody>
                        </Card>

                    </Col>
                </Row>
            </Container>

            {/* 3. BARRA INFERIOR */}
            <div className="bg-white border-top fixed-bottom d-flex justify-content-around align-items-center py-2 px-1 shadow-lg" style={{ zIndex: 1040, height: '65px' }}>
                <Link to="/" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z"/><path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293z"/></svg>
                </Link>
                <Link to="/comunidade" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>
                </Link>
                <Link to="/criar" className="text-danger d-flex flex-column align-items-center text-decoration-none" style={{ transform: 'scale(1.2)', marginBottom: '5px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
                </Link>
                <Link to="/pesquisar" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>
                </Link>
                <Link to="/financas" className="text-secondary d-flex flex-column align-items-center text-decoration-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/><path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/></svg>
                </Link>
            </div>
        </div>
    );
};

export default CreateMenuPage;