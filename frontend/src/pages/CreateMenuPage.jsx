import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';

const CreateMenuPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const storedUsername = localStorage.getItem('matchup_username');
        if (storedUsername) setUsername(storedUsername);
    }, []);

    return (
        <div className="landing-bg min-vh-100 pb-5 d-flex flex-column">
            
            <TopNavBarSimple/>

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

            <BottomNavBar />
        </div>
    );
};

export default CreateMenuPage;