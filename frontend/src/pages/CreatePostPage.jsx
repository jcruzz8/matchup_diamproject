import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Button, Input, Form, FormGroup, Label, Spinner } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import AppAlert from '../components/AppAlert';
import { useUserContext } from "../context/UserProvider.jsx";

const CreatePostPage = () => {
    const navigate = useNavigate();
    const { user } = useUserContext();
    const userId = Number(user?.player_id);

    const fileInputRef = useRef(null);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [description, setDescription] = useState('');
    const [modality, setModality] = useState('Futebol');
    const [loading, setLoading] = useState(false);
    
    const [notification, setNotification] = useState({ message: '', type: '', isOpen: false });

    const showNotification = (message, type) => {
        setNotification({ message, type, isOpen: true });
        setTimeout(() => setNotification({ ...notification, isOpen: false }), 3000);
    };

    const triggerFileSelect = () => { fileInputRef.current.click(); };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation(); 
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!image) {
            showNotification("Precisas de escolher uma fotografia para publicar!", "warning");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('player', userId);
        formData.append('image', image);
        formData.append('description', description);
        formData.append('modality', modality);

        try {
            await axios.post('http://localhost:8000/api/highlights/', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': getCSRFToken()
                }
            });
            showNotification("Publicado com sucesso!", "success");
            setTimeout(() => navigate('/perfil'), 1000); // Dá tempo para o utilizador ver a notificação verde
        } catch (error) {
            console.error("Erro ao publicar Highlight:", error);
            showNotification("Erro ao publicar. Verifica a tua ligação.", "danger");
        } finally {
            setLoading(false);
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
            <AppAlert {...notification} toggle={() => setNotification({...notification, isOpen: false})} />

            <Container className="pt-4 pb-5 mb-5">
                <div className="bg-white rounded-4 shadow-sm p-4 mx-auto" style={{ maxWidth: '600px' }}>
                    <div className="d-flex align-items-center justify-content-between gap-3 mb-4" style={{ minHeight: '42px' }}>
                        <Button color="link" className="text-dark p-0" onClick={() => navigate(-1)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                            </svg>
                        </Button>
                        <div className="flex-grow-1 text-center">
                            <h5 className="m-0 fw-bold">Nova Publicação</h5>
                        </div>
                        <div style={{ width: '36px' }} />
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <Label className="fw-bold text-dark mb-2">Fotografia do Highlight *</Label>
                            <input type="file" accept="image/*" className="d-none" ref={fileInputRef} onChange={handleImageChange}/>

                            <div 
                                className={`rounded-4 overflow-hidden position-relative cursor-pointer border ${imagePreview ? 'border-0' : 'border-dashed border-2 border-secondary border-opacity-50 bg-light'}`}
                                style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                onClick={triggerFileSelect}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                                        <Button color="dark" size="sm" className="position-absolute top-0 end-0 m-2 rounded-circle d-flex justify-content-center align-items-center opacity-75 hover-opacity-100" style={{ width: '30px', height: '30px' }} onClick={handleRemoveImage}>
                                            ✕
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="rounded-circle bg-danger bg-opacity-10 d-flex justify-content-center align-items-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-danger" viewBox="0 0 16 16"><path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/></svg>
                                        </div>
                                        <h6 className="fw-bold text-dark m-0">Tocar para escolher a foto</h6>
                                        <small className="text-muted">Partilha a tua melhor jogada!</small>
                                    </div>
                                )}
                            </div>
                        </div>

                        <FormGroup className="mb-4">
                            <Label className="fw-bold text-dark mb-2">Desporto</Label>
                            <div className="d-flex bg-light rounded-pill p-1 shadow-sm border w-100">
                                <button type="button" className={`btn flex-fill rounded-pill fw-bold ${modality === 'Futebol' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`} onClick={() => setModality('Futebol')}>Futebol</button>
                                <button type="button" className={`btn flex-fill rounded-pill fw-bold ${modality === 'Basketball' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`} onClick={() => setModality('Basketball')}>Basketball</button>
                            </div>
                        </FormGroup>

                        <FormGroup className="mb-4">
                            <Label className="fw-bold text-dark mb-2">Legenda <small className="text-muted fw-normal">(Opcional)</small></Label>
                            <Input type="textarea" rows="4" placeholder="Escreve algo sobre esta foto..." className="rounded-4 bg-light border-secondary border-opacity-25 shadow-sm p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </FormGroup>

                        <Button color="danger" type="submit" className="w-100 rounded-pill py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2" disabled={loading || !image}>
                            {loading ? <>A Publicar... <Spinner size="sm" color="light" /></> : "Publicar Highlight"}
                        </Button>
                    </Form>
                </div>
            </Container>
            <BottomNavBar />
        </div>
    );
};

export default CreatePostPage;