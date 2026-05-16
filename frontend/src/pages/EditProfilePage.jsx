import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert, Row, Col } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('matchup_user_id');
    const fileInputRef = useRef(null);

    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', color: 'success' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado para a foto
    const [newPhoto, setNewPhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Estado do formulário
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        birth_date: '',
        height: '',
        zone: '',
        gender: '',
        is_public: true
    });

    // Calcula idade
    const calculateAge = (dob) => {
        if (!dob) return '';
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs); 
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }
        fetchUserData();
    }, [userId, navigate]);

    const fetchUserData = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/players/${userId}/`);
            const data = res.data;
            
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
                birth_date: data.birth_date || '',
                height: data.height || '',
                zone: data.zone || '',
                gender: data.gender || '',
                is_public: data.is_public !== undefined ? data.is_public : true
            });

            // Configurar foto atual
            let picUrl = data.photo || data.image || data.profile_picture;
            if (picUrl) {
                if (picUrl.startsWith('/')) picUrl = `http://127.0.0.1:8000${picUrl}`;
                setPreviewUrl(picUrl);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
            showAlert('Erro ao carregar os teus dados.', 'danger');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const showAlert = (message, color) => {
        setAlertConfig({ show: true, message, color });
        setTimeout(() => setAlertConfig({ show: false, message: '', color: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const dataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
            // Se for nulo ou vazio e não for boolean, não enviamos ou enviamos vazio consoante a necessidade
            if (formData[key] !== null && formData[key] !== undefined) {
                dataToSend.append(key, formData[key]);
            }
        });

        // Só anexa a foto se o utilizador tiver escolhido uma NOVA foto
        if (newPhoto) {
            dataToSend.append('photo', newPhoto);
        }

        try {
            // Usamos PATCH em vez de PUT para atualizar apenas os campos enviados
            await axios.patch(`http://127.0.0.1:8000/api/players/${userId}/`, dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Atualizar o username no localStorage se foi alterado
            localStorage.setItem('matchup_username', formData.username);

            showAlert('Perfil atualizado com sucesso!', 'success');
            setTimeout(() => navigate('/perfil'), 2000);

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            showAlert('Erro ao atualizar. O Username/Email já existe?', 'danger');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

            {alertConfig.show && (
                <Alert color={alertConfig.color} className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg fw-bold" style={{ zIndex: 1050, minWidth: '300px', textAlign: 'center' }}>
                    {alertConfig.message}
                </Alert>
            )}

            <Container className="pt-4 pb-5 mb-4">
                <div className="text-center mb-4">
                    <h3 className="fw-bold m-0 text-dark">Editar Perfil</h3>
                    <p className="text-muted small">Mantém os teus dados de craque atualizados.</p>
                </div>

                <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-5">
                    <CardBody className="p-4 p-md-5">
                        <Form onSubmit={handleSubmit}>
                            
                            {/* FOTO DE PERFIL */}
                            <div className="d-flex flex-column align-items-center mb-4">
                                <div 
                                    className="rounded-circle bg-secondary bg-opacity-25 d-flex justify-content-center align-items-center overflow-hidden border border-3 border-danger cursor-pointer position-relative shadow-sm" 
                                    style={{ width: '110px', height: '110px' }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="text-center text-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="mb-1" viewBox="0 0 16 16"><path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/><path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
                                        </div>
                                    )}
                                    <div className="position-absolute bottom-0 w-100 bg-dark bg-opacity-50 text-white text-center py-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>ALTERAR</div>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="d-none" />
                                </div>
                            </div>

                            {/* DADOS BÁSICOS */}
                            <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">Informações Pessoais</h6>

                            <Row className="gx-3">
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">Primeiro Nome</Label>
                                        <Input type="text" name="first_name" className="border-2 bg-light shadow-none fw-bold text-dark" value={formData.first_name} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">Último Nome</Label>
                                        <Input type="text" name="last_name" className="border-2 bg-light shadow-none fw-bold text-dark" value={formData.last_name} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <FormGroup className="mb-3">
                                <Label className="fw-bold small text-muted text-uppercase">Username</Label>
                                <Input type="text" name="username" className="border-2 bg-light shadow-none fw-bold text-dark" value={formData.username} onChange={handleChange} required />
                            </FormGroup>

                            <FormGroup className="mb-4">
                                <Label className="fw-bold small text-muted text-uppercase">Email</Label>
                                <Input type="email" name="email" className="border-2 bg-light shadow-none fw-bold" value={formData.email} onChange={handleChange} required />
                            </FormGroup>

                            {/* DADOS FÍSICOS E LOCALIZAÇÃO */}
                            <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">Atributos e Localização</h6>

                            <Row className="gx-3">
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">
                                            Data Nasc. {formData.birth_date && <span className="text-danger text-lowercase ms-1">({calculateAge(formData.birth_date)} anos)</span>}
                                        </Label>
                                        <Input type="date" name="birth_date" className="border-2 bg-light shadow-none fw-bold text-muted" value={formData.birth_date} onChange={handleChange} />
                                    </FormGroup>
                                </Col>
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">Altura (cm)</Label>
                                        <Input type="number" name="height" placeholder="Ex: 180" className="border-2 bg-light shadow-none fw-bold" value={formData.height} onChange={handleChange} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Row className="gx-3">
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">Género</Label>
                                        <Input type="select" name="gender" className="border-2 bg-light shadow-none fw-bold" value={formData.gender} onChange={handleChange}>
                                            <option value="">Selecione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col xs={6}>
                                    <FormGroup className="mb-3">
                                        <Label className="fw-bold small text-muted text-uppercase">Telemóvel</Label>
                                        <Input type="text" name="phone" className="border-2 bg-light shadow-none fw-bold" value={formData.phone} onChange={handleChange} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <FormGroup className="mb-4">
                                <Label className="fw-bold small text-muted text-uppercase">Zona/Cidade Base</Label>
                                <Input type="text" name="zone" placeholder="Ex: Lisboa" className="border-2 bg-light shadow-none fw-bold" value={formData.zone} onChange={handleChange} />
                            </FormGroup>

                            {/* PRIVACIDADE */}
                            <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">Definições</h6>
                            
                            <FormGroup switch className="d-flex justify-content-between align-items-center mb-5 px-1">
                                <div>
                                    <Label check className="fw-bold m-0">Perfil Público</Label>
                                    <div className="small text-muted">Permitir que outros encontrem o teu perfil.</div>
                                </div>
                                <Input type="switch" name="is_public" role="switch" checked={formData.is_public} onChange={handleChange} style={{ width: '40px', height: '20px' }} />
                            </FormGroup>

                            <div className="mt-4">
                                <Button type="submit" className="btn-custom-red w-100 py-3 fw-bold fs-5 rounded-3 shadow-sm mb-3" disabled={isSubmitting}>
                                    {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
                                </Button>
                                
                                <Button type="button" color="light" className="w-100 py-3 fw-bold fs-6 rounded-3 shadow-sm text-muted border border-secondary border-opacity-25" onClick={() => navigate('/perfil')} disabled={isSubmitting}>
                                    Cancelar alterações
                                </Button>
                            </div>
                        </Form>
                    </CardBody>
                </Card>
            </Container>
        </div>
    );
};

export default EditProfilePage;