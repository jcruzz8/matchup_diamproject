import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import { useUserContext } from "../context/UserProvider.jsx";

const CreateGamePage = () => {
    const navigate = useNavigate();

    // Extrair o utilizador do contexto
    const { user } = useUserContext();

    // Garantir que temos o ID correto para associar ao jogo
    const organizerId = user?.player_id;

    const [formData, setFormData] = useState({
        modality: 'Futebol',
        location: '',
        date: '',
        time: '',
        registration_deadline: '',
        payment_deadline: '',
        price: '',
        titulares: '5',
        suplentes: '0',
        cor_equipa1: '#ff0000',
        cor_equipa2: '#0000ff',
        distribution_model: 'Escolha Livre'
    });

    const hoje = new Date().toISOString().split('T')[0];

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Se mudarmos a modalidade, ajustamos logo os titulares por defeito para fazer sentido
        if (name === 'modality') {
            const defaultTitulares = value === 'Basketball' ? '5' : '5';
            setFormData({ ...formData, [name]: value, titulares: defaultTitulares });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setAlertConfig({ show: true, message: 'Precisas de iniciar sessão antes de criar um jogo.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            return;
        }

        if (formData.payment_deadline && formData.registration_deadline && formData.payment_deadline < formData.registration_deadline) {
            setAlertConfig({ show: true, message: 'A data limite de pagamento deve ser igual ou posterior à data limite de inscrição.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 3000);
            return;
        }
        try {
            // Criar cópia e converter tipos antes de enviar
            const payload = {
                ...formData,
                organizer: user.player_id,
                titulares: parseInt(formData.titulares),
                suplentes: parseInt(formData.suplentes),
                price: parseFloat(formData.price || 0)
            };
            await axios.post('http://localhost:8000/api/games/', payload, {
                headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' },
                withCredentials: true
            });
            setAlertConfig({ show: true, message: 'Jogo criado com sucesso! A preparar o campo...', color: 'success' });
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            console.error(error.response?.data);
            const backendMessage = error.response?.data?.error || error.response?.data?.detail || JSON.stringify(error.response?.data);
            setAlertConfig({ show: true, message: backendMessage || 'Erro ao criar jogo. Verifica os dados.', color: 'danger' });
            setTimeout(() => setAlertConfig({ show: false, message: '', color: 'danger' }), 5000);
        }
    };

    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    }

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            <Container className="pt-4 pb-5 mb-4">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow-sm border-0 rounded-4 mb-5">
                            <CardBody className="p-4 p-md-5">
                                <div className="d-flex align-items-center justify-content-between gap-3 mb-4" style={{ minHeight: '42px' }}>
                                    <Button color="link" className="text-dark p-0" onClick={() => navigate(-1)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                                        </svg>
                                    </Button>
                                    <h3 className="fw-bold m-0 text-dark flex-grow-1 text-center">Agendar Novo Match</h3>
                                    <div style={{ width: '36px' }} />
                                </div>

                                <Form onSubmit={handleSubmit}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold">Modalidade</Label>
                                        <Input type="select" name="modality" value={formData.modality} onChange={handleChange} required>
                                            <option value="Futebol">Futebol</option>
                                            <option value="Basketball">Basketball</option>
                                        </Input>
                                    </FormGroup>

                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold">Local / Recinto</Label>
                                        <Input type="text" name="location" placeholder="Ex: Pavilhão da Luz" value={formData.location} onChange={handleChange} required />
                                    </FormGroup>

                                    <Row>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold">Data</Label>
                                                <Input type="date" name="date" min={hoje} value={formData.date} onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold">Hora</Label>
                                                <Input type="time" name="time" value={formData.time} onChange={handleChange} required />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold">Data limite de inscrição</Label>
                                                <Input type="date" name="registration_deadline" min={hoje} max={formData.date} value={formData.registration_deadline} onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold">Data limite de pagamento</Label>
                                                <Input type="date" name="payment_deadline" min={formData.registration_deadline} max={formData.date} value={formData.payment_deadline} onChange={handleChange} required />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <FormGroup className="mb-4">
                                        <Label className="fw-bold">Preço por pessoa (€)</Label>
                                        <Input type="number" step="0.50" min="0" name="price" placeholder="Ex: 5.00 (0 = Grátis)" value={formData.price} onChange={handleChange} required />
                                    </FormGroup>

                                    <hr className="my-4 text-muted" />
                                    <h5 className="fw-bold mb-3">Definições das Equipas</h5>

                                    <Row>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold small">Titulares (por equipa)</Label>
                                                <Input type="select" name="titulares" value={formData.titulares} onChange={handleChange} required>
                                                    {formData.modality === 'Futebol' ? (
                                                        <>
                                                            <option value="5">Fut 5 (5v5)</option>
                                                            <option value="7">Fut 7 (7v7)</option>
                                                            <option value="9">Fut 9 (9v9)</option>
                                                            <option value="11">Fut 11 (11v11)</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="1">Solo (1v1)</option>
                                                            <option value="2">Duplas (2v2)</option>
                                                            <option value="3">Trios (3v3)</option>
                                                            <option value="5">Squad (5v5)</option>
                                                        </>
                                                    )}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col xs={6}>
                                            <FormGroup className="mb-3">
                                                <Label className="fw-bold small">Suplentes (por equipa)</Label>
                                                <Input type="number" min="0" name="suplentes" placeholder="Ex: 2" value={formData.suplentes} onChange={handleChange} required />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col xs={6}>
                                            <FormGroup className="mb-4">
                                                <Label className="fw-bold small">Cor da Equipa 1</Label>
                                                <Input type="color" name="cor_equipa1" className="w-100 p-1 form-control form-control-color cursor-pointer" value={formData.cor_equipa1} onChange={handleChange} required style={{ height: '45px' }} />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={6}>
                                            <FormGroup className="mb-4">
                                                <Label className="fw-bold small">Cor da Equipa 2</Label>
                                                <Input type="color" name="cor_equipa2" className="w-100 p-1 form-control form-control-color cursor-pointer" value={formData.cor_equipa2} onChange={handleChange} required style={{ height: '45px' }} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <FormGroup className="mb-4">
                                        <Label className="fw-bold">Modelo de Distribuição</Label>
                                        <Input type="select" name="distribution_model" value={formData.distribution_model} onChange={handleChange} required>
                                            <option value="Escolha Livre">Escolha Livre - Os jogadores escolhem a Equipa 1 ou 2</option>
                                            <option value="Auto-Balanceamento">Auto-Balanceamento - O sistema equilibra as equipas</option>
                                            <option value="Equipa vs Equipa">Equipa vs Equipa - Inscrição exclusiva para equipas</option>
                                        </Input>
                                    </FormGroup>

                                    <Button type="submit" className="btn-custom-red w-100 py-3 fs-5 fw-bold shadow-sm mt-2">
                                        Criar Match
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default CreateGamePage;