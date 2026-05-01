import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Card, CardBody, Alert } from 'reactstrap';

const RegisterPage = () => {
    const navigate = useNavigate();
    
    const sportOptions = {
        'Futebol/Futsal': ['Universal', 'Guarda-redes', 'Defesa', 'Central', 'Extremo', 'Lateral', 'Médio', 'Avançado', 'Fixo', 'Ala', 'Pivô', 'Banco'],
        'Basketball': ['Base (PG)', 'Extremo-Base (SG)', 'Extremo (SF)', 'Extremo-Poste (PF)', 'Poste (C)', 'Banco'],
    };

    // Estado para guardar todos os dados do formulário
    const [formData, setFormData] = useState({
        photo: null,
        username: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        age: '',
        gender: '',
        height: '',
        zone: '',
        is_public: true,
        modalities: [],
        positions: {}
    });

    
    const [photoPreview, setPhotoPreview] = useState(null);

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });

    // Atualizar campos de texto normais e selects
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Atualizar a foto e gerar a prévia arredondada
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, photo: file });

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(null);
        }
    };

    // Lógica para as checkboxes das modalidades
    const handleModalityChange = (e) => {
        const mod = e.target.value;
        const isChecked = e.target.checked;

        let newModalities = [...formData.modalities];
        let newPositions = { ...formData.positions };

        if (isChecked) {
            newModalities.push(mod);
            newPositions[mod] = sportOptions[mod][0]; // Define a 1ª posição por defeito
        } else {
            newModalities = newModalities.filter(m => m !== mod);
            delete newPositions[mod]; // Remove a posição se desmarcar a modalidade
        }

        setFormData({ ...formData, modalities: newModalities, positions: newPositions });
    };

    // Lógica para os selects das posições
    const handlePositionChange = (modality, position) => {
        setFormData({
            ...formData,
            positions: { ...formData.positions, [modality]: position }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();

        submitData.append('username', formData.username);
        submitData.append('name', formData.name);
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        submitData.append('phone', formData.phone);
        submitData.append('age', formData.age);
        submitData.append('gender', formData.gender);
        submitData.append('is_public', formData.is_public ? 'True' : 'False');

        if (formData.height) submitData.append('height', formData.height);
        if (formData.zone) submitData.append('zone', formData.zone);
        if (formData.photo) submitData.append('photo', formData.photo);

        submitData.append('sport_positions', JSON.stringify(formData.positions));

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/players/', submitData, { // Comunica pelo axios com o Django, e espera pela resposta
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setAlertConfig({ show: true, message: 'Conta criada com sucesso! A redirecionar...', color: 'success' });

            // Espera 3 segundos e redireciona para a página inicial
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (error) {
            // Erro: Formata as mensagens do Django para serem mais legíveis
            let errorMessage = "Erro ao criar conta: ";
            if (error.response?.data) {
                const errors = Object.entries(error.response.data)
                    .map(([key, value]) => `${key} - ${value}`)
                    .join(' | ');
                errorMessage += errors;
            } else {
                errorMessage += error.message;
            }

            setAlertConfig({ show: true, message: errorMessage, color: 'danger' });

            // Espera 3 segundos e esconde o alerta vermelho
            setTimeout(() => {
                setAlertConfig({ show: false, message: '', color: 'danger' });
            }, 3000);
        }
    };

    return (
        <div className="landing-bg min-vh-100 py-5">

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
                    <Col md={10} lg={8}>
                        <Card className="shadow-lg border-0">
                            <CardBody className="p-5">
                                <h2 className="fw-bold mb-4 text-center text-dark">Junta-te ao <span className="text-danger fw-bold text-decoration-none">Match Up</span></h2>

                                <Form onSubmit={handleSubmit}>

                                    {/* PRÉVIA DA FOTO DE PERFIL */}
                                    <div className="d-flex flex-column align-items-center mb-4">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Prévia do Perfil"
                                                className="rounded-circle shadow"
                                                style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-secondary d-flex justify-content-center align-items-center shadow-sm"
                                                style={{ width: '130px', height: '130px' }}
                                            >
                                                {/* Ícone SVG do "Boneco" De User */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="currentColor" className="text-white opacity-75" viewBox="0 0 16 16">
                                                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                                                </svg>
                                            </div>
                                        )}
                                        <FormGroup className="mt-3 w-100 text-center">
                                            <Label for="photo" className="fw-bold text-muted small">Adicionar Foto de Perfil (Opcional)</Label>
                                            <Input id="photo" name="photo" type="file" accept="image/*" onChange={handleFileChange} className="w-50 mx-auto" />
                                        </FormGroup>
                                    </div>

                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="email" className="fw-bold">Email *</Label>
                                                <Input id="email" name="email" type="email" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="phone" className="fw-bold">Telemóvel *</Label>
                                                <Input id="phone" name="phone" type="tel" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="username" className="fw-bold">Nome de Utilizador *</Label>
                                                <Input id="username" name="username" type="text" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="password" className="fw-bold">Palavra-passe *</Label>
                                                <Input id="password" name="password" type="password" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col md={12}>
                                            <FormGroup switch className="fs-5">
                                                <Input
                                                    type="switch"
                                                    name="is_public"
                                                    id="is_public"
                                                    checked={formData.is_public}
                                                    onChange={handleChange}
                                                    className="cursor-pointer"
                                                />
                                                <Label check for="is_public" className="fw-bold text-dark ms-2">
                                                    Perfil {formData.is_public ? "Público" : "Privado"}
                                                </Label>
                                            </FormGroup>
                                            <small className="text-muted">
                                                {formData.is_public
                                                    ? "O teu perfil, estatísticas e media estão visíveis para toda a comunidade do Match Up."
                                                    : "O teu perfil está oculto. Apenas as equipas de que fazes parte e os teus seguidores conseguem ver o teu perfil."}
                                            </small>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="name" className="fw-bold">Primeiro e Último Nome *</Label>
                                                <Input id="name" name="name" type="text" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="zone" className="fw-bold">Zona/Localidade</Label>
                                                <Input id="zone" name="zone" type="text" placeholder="Opcional" onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="age" className="fw-bold">Idade *</Label>
                                                <Input id="age" name="age" type="number" min="10" required onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="gender" className="fw-bold">Género *</Label>
                                                <Input id="gender" name="gender" type="select" required onChange={handleChange} defaultValue="">
                                                    <option value="" disabled>Selecionar...</option>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Feminino">Feminino</option>
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="height" className="fw-bold">Altura (cm)</Label>
                                                <Input id="height" name="height" type="number" placeholder="Opcional" onChange={handleChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr className="my-4" />
                                    <h5 className="fw-bold mb-3">As tuas Modalidades</h5>

                                    <FormGroup>
                                        {Object.keys(sportOptions).map((mod) => (
                                            <FormGroup check inline key={mod} className="me-4 mb-3">
                                                <Input
                                                    type="checkbox"
                                                    value={mod}
                                                    onChange={handleModalityChange}
                                                />
                                                <Label check>{mod}</Label>
                                            </FormGroup>
                                        ))}
                                    </FormGroup>

                                    {formData.modalities.map((mod) => (
                                        <FormGroup key={`pos-${mod}`} className="bg-light p-3 rounded mb-3 border">
                                            <Label className="fw-bold text-danger">A tua posição em {mod}:</Label>
                                            <Input
                                                type="select"
                                                value={formData.positions[mod]}
                                                onChange={(e) => handlePositionChange(mod, e.target.value)}
                                            >
                                                {sportOptions[mod].map(pos => (
                                                    <option key={pos} value={pos}>{pos}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    ))}

                                    <Button type="submit" className="btn-custom-red w-100 py-3 fs-5 mt-4 fw-bold shadow-sm">
                                        Concluir Registo
                                    </Button>

                                    <div className="text-center">
                                        <span className="text-muted">Já tens conta? </span>
                                        <Link to="/login" className="text-danger fw-bold text-decoration-none">
                                            Inicia sessão aqui
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

export default RegisterPage;