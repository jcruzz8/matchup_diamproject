import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Container, Button, Card, CardBody, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple.jsx';
import BottomNavBar from '../components/BottomNavBar.jsx';

// Função para ir buscar o token CSRF
const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

const FinancePage = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para o Modal de Pagamento
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedReg, setSelectedReg] = useState(null);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:8000/api/registrations/me/', { withCredentials: true });
                setRegistrations(response.data);
            } catch (fetchError) {
                console.error('Erro ao carregar despesas:', fetchError);
                setError('Não foi possível carregar as despesas.');
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);

    // LÓGICA DE FILTROS ATUALIZADA:
    // Só vão para as dívidas os jogos que já foram ACEITES (APPROVED) pelo organizador, 
    // que não sejam grátis (> 0) e que o payment_status seja PENDING.

    const pendingExpenses = useMemo(() => registrations.filter(reg => 
        reg.status === 'APPROVED' && 
        reg.payment_status === 'PENDING' && 
        Number(reg.game_price) > 0 &&
        new Date(reg.payment_deadline) >= today
    ), [registrations, today]);

    const overdueExpenses = useMemo(() => registrations.filter(reg => 
        reg.status === 'APPROVED' && 
        reg.payment_status === 'PENDING' && 
        Number(reg.game_price) > 0 &&
        new Date(reg.payment_deadline) < today
    ), [registrations, today]);

    const paidExpenses = useMemo(() => registrations.filter(reg => 
        reg.status === 'APPROVED' && 
        (reg.payment_status === 'PAID' || Number(reg.game_price) === 0)
    ), [registrations]);

    const openPaymentModal = (reg) => {
        setSelectedReg(reg);
        setPaymentModal(true);
    };

    const togglePaymentModal = () => {
        setPaymentModal(!paymentModal);
        if(paymentModal) setSelectedReg(null); // Limpa ao fechar
    };

    const handleConfirmPayment = async () => {
        if (!selectedReg) return;
        setIsPaying(true);
        try {
            const csrftoken = getCookie('csrftoken');
            await axios.post(`http://localhost:8000/api/registrations/${selectedReg.id}/pay/`, {}, {
                headers: { 'X-CSRFToken': csrftoken },
                withCredentials: true
            });

            // Atualiza o estado local para mover o card para a aba "Pagos" instantaneamente
            setRegistrations(prev => prev.map(r => 
                r.id === selectedReg.id ? { ...r, payment_status: 'PAID' } : r
            ));
            
            togglePaymentModal();
            setActiveTab('paid'); // Redireciona automaticamente o user para a aba dos pagos!
        } catch (err) {
            console.error('Erro ao confirmar pagamento:', err);
            alert("Ocorreu um erro ao confirmar o pagamento.");
        } finally {
            setIsPaying(false);
        }
    };

    const renderExpenseCard = (reg, isPaid) => {
        const isOverdue = !isPaid && new Date(reg.payment_deadline) < today;
        return (
            <Card key={reg.id} className="shadow-sm border-0 rounded-4 mb-3">
                <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 className="fw-bold m-0">{reg.game_modality || 'Jogo'}</h6>
                            <small className="text-muted">{reg.game_location || 'Local'}</small>
                        </div>
                        <Badge color={isPaid ? "success" : isOverdue ? "danger" : "warning"} className="rounded-pill px-3">
                            {isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                        </Badge>
                    </div>
                    <div className="text-muted small mb-3">
                        {reg.game_date} às {reg.game_time?.slice(0,5)} | <b>{reg.game_price}€</b>
                    </div>
                    <div className="p-2 bg-light rounded-3 small text-muted">
                        {isPaid ? 'Pagamento confirmado.' : isOverdue ? 'Prazo de pagamento expirado!' : `Data limite: ${reg.payment_deadline}`}
                    </div>

                    {/* BOTÃO DE PAGAR */}
                    {!isPaid && activeTab === 'pending' && (
                        <Button color="success" className="w-100 mt-3 fw-bold rounded-pill shadow-sm" onClick={() => openPaymentModal(reg)}>
                            Pagar
                        </Button>
                    )}
                </CardBody>
            </Card>
        );
    };

    return (
        <div className="bg-light min-vh-100 pb-5" style={{ paddingTop: '70px' }}>
            <div className="fixed-top w-100"><TopNavBarSimple /></div>

            <Container className="pb-5">
                <h4 className="text-center fw-bold mb-3">Dívidas</h4>
                
                <div className="d-flex bg-white rounded-pill p-1 shadow-sm border mb-4">
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'pending' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('pending')}>A Pagar ({pendingExpenses.length})</button>
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'overdue' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('overdue')}>Não Pagos ({overdueExpenses.length})</button>
                    <button className={`btn btn-sm flex-fill rounded-pill fw-bold ${activeTab === 'paid' ? 'btn-danger shadow-sm' : 'text-muted border-0 bg-transparent'}`} onClick={() => setActiveTab('paid')}>Pagos ({paidExpenses.length})</button>
                </div>

                {loading ? <div className="text-center py-5">Carregando...</div> : 
                 error ? <div className="text-center py-5 text-danger">{error}</div> : (
                    <div>
                        {activeTab === 'pending' && pendingExpenses.map(r => renderExpenseCard(r, false))}
                        {activeTab === 'overdue' && overdueExpenses.map(r => renderExpenseCard(r, false))}
                        {activeTab === 'paid' && paidExpenses.map(r => renderExpenseCard(r, true))}
                        
                        {(activeTab === 'pending' && pendingExpenses.length === 0) || 
                         (activeTab === 'overdue' && overdueExpenses.length === 0) || 
                         (activeTab === 'paid' && paidExpenses.length === 0) ? (
                            <div className="text-center py-5 text-muted">Sem match's aqui.</div>
                        ) : null}
                    </div>
                )}
            </Container>

            {/* MODAL DE PAGAMENTO */}
            <Modal isOpen={paymentModal} toggle={togglePaymentModal} centered>
                <ModalHeader toggle={togglePaymentModal} className="fw-bold border-0 pb-0">
                    Confirmar Pagamento
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted">
                        Envie o dinheiro (<b>{selectedReg?.game_price}€</b>) por MBWay ou Transferência para o utilizador 
                        <strong className="text-dark"> {selectedReg?.game_organizer_username || 'Organizador'} </strong> 
                        e confirme o pagamento abaixo.
                    </p>
                    <div className="p-3 bg-light rounded-3 text-center border">
                        <small className="text-muted d-block mb-1">Referência do Jogo</small>
                        <span className="fw-bold">{selectedReg?.game_modality} - {selectedReg?.game_location}</span>
                    </div>
                </ModalBody>
                <ModalFooter className="border-0 pt-0">
                    <Button color="light" onClick={togglePaymentModal} className="fw-bold" disabled={isPaying}>Cancelar</Button>
                    <Button color="success" className="fw-bold px-4 shadow-sm" onClick={handleConfirmPayment} disabled={isPaying}>
                        {isPaying ? 'A processar...' : 'Confirmar Pagamento'}
                    </Button>
                </ModalFooter>
            </Modal>

            <BottomNavBar />
        </div>
    );
};

export default FinancePage;