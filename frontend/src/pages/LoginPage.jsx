import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Card, CardBody, Alert } from 'reactstrap';
import {useUserContext} from "../context/UserProvider.jsx";

const LoginPage = () => {
    const navigate = useNavigate();

    const {user, setUser} = useUserContext();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });

    //const handleChange = (e) => {
    //    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    //};

    const handleSubmit = async (e) => {
        e.preventDefault();

        axios.post('http://localhost:8000/api/login/', {username, password}, {withCredentials: true})
            .then((response) => {
                setUser(response.data);
                setAlertConfig({ show: true, message: 'Login efetuado com sucesso! A entrar...', color: 'success' });
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            })
            .catch((error) => {
                const errorMessage = error.response?.data?.error || 'Erro de conexão ao servidor.';

                setAlertConfig({show: true, message: errorMessage, color: 'danger'});

                setTimeout(() => {
                    setAlertConfig({show: false, message: '', color: 'danger'});
                }, 3000);

            }); // axios faz o pedido ao Django, e espera pela resposta



    };

    return (
        <div className="landing-bg min-vh-100 py-5 position-relative d-flex align-items-center">

            {/* SISTEMA DE ALERTAS */}
            {alertConfig.show && (
                <Alert
                    color={alertConfig.color}
                    className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold"
                    style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}
                >
                    {alertConfig.message}
                </Alert>
            )}

            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={5}>
                        <Card className="shadow-lg border-0">
                            <CardBody className="p-5">

                                {/* CABEÇALHO */}
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-dark">Iniciar Sessão</h2>
                                    <p className="text-muted">Bem-vindo de volta ao Match Up!</p>
                                </div>

                                <Form onSubmit={handleSubmit}>

                                    <FormGroup className="mb-3">
                                        <Label for="username" className="fw-bold">Nome de Utilizador</Label>
                                        <Input id="username" name="username" type="text" required onChange={(e) => setUsername(e.target.value)} />
                                    </FormGroup>

                                    <FormGroup className="mb-4">
                                        <div className="d-flex justify-content-between">
                                            <Label for="password" className="fw-bold">Palavra-passe</Label>
                                        </div>
                                        <Input id="password" name="password" type="password" required onChange={(e) => setPassword(e.target.value)} />
                                    </FormGroup>

                                    <Button type="submit" className="btn-custom-red w-100 py-3 fs-5 fw-bold shadow-sm mb-4">
                                        Entrar
                                    </Button>

                                    <div className="text-center">
                                        <span className="text-muted">Ainda não tens conta? </span>

                                        <Link to="/register" className="text-danger fw-bold text-decoration-none">
                                            Regista-te aqui
                                        </Link>
                                    </div>

                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default LoginPage;