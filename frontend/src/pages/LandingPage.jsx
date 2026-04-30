import { Container, Row, Col, Button } from 'reactstrap';

const LandingPage = () => {
  return (
    <div className="bg-light min-vh-100 d-flex flex-column justify-content-center">
      <Container className="text-center">
        <Row>
          <Col md={{ size: 8, offset: 2 }}>
            <h1 className="display-3 text-primary fw-bold mb-4">Match Up</h1>
            <p className="lead mb-5">
              A melhor rede social para organizar jogos com os teus amigos. 
              Futebol, Basket e muito mais. Cria equipas, gere inscrições e domina o campo!
            </p>
            <div>
              <Button color="primary" size="lg" className="me-3">
                Criar Conta
              </Button>
              <Button color="outline-primary" size="lg">
                Iniciar Sessão
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LandingPage;