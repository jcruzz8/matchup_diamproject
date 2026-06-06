import { Container, Row, Col, Button } from 'reactstrap';
import logo from '../assets/logo.png';
import {Link, useNavigate} from 'react-router-dom';
import {useUserContext} from "../context/UserProvider.jsx";

const LandingPage = () => {
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const handleGuest = async () => {
    setUser(null);
    navigate('/');
  }
  return (
    <div className="landing-bg min-vh-100 d-flex flex-column justify-content-center align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} className="text-center bg-white p-5 rounded shadow-lg">
            
            <img 
              src={logo} 
              alt="Match Up Logo" 
              className="img-fluid mb-4" 
              style={{ maxWidth: '350px' }} 
            />

            <h2 className="fw-bold mb-4 text-dark">
              A plataforma para marcares os teus jogos.
            </h2>
            
            <p className="lead mb-5 text-secondary">
                Junta os teus amigos, desafia outras <strong> equipas </strong> 
                e marca os teus jogos de forma fácil e rápida! Vais ficar de fora ?
            </p>
            
            <div className="d-flex justify-content-center gap-3">
              <Button tag={Link} to="/register" className="btn-custom-red px-4 py-2 fs-5 fw-bold shadow-sm">
                Criar Conta
              </Button>
              <Button tag={Link} to="/login" color="dark" outline className="px-4 py-2 fs-5 fw-bold shadow-sm">
                Iniciar Sessão
              </Button>
            </div>

            <Button color="grey" outline className="text-secondary text-decoration-none fw-bold mt-2" onClick={handleGuest}>
                    Continuar como Convidado
              </Button>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LandingPage;