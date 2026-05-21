import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BottomNavBar from '../components/BottomNavBar.jsx';

const FinancePage = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('http://localhost:8000/api/registrations/me/');
                setRegistrations(response.data);
            } catch (fetchError) {
                console.error('Erro ao carregar despesas:', fetchError);
                setError('Não foi possível carregar as despesas. Tenta novamente mais tarde.');
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

    const pendingExpenses = useMemo(
        () => registrations.filter(reg => reg.status === 'PENDING' && new Date(reg.game_payment_deadline) >= today),
        [registrations, today]
    );

    const overdueExpenses = useMemo(
        () => registrations.filter(reg => reg.status === 'PENDING' && new Date(reg.game_payment_deadline) < today),
        [registrations, today]
    );

    const paidExpenses = useMemo(
        () => registrations.filter(reg => reg.status === 'APPROVED'),
        [registrations]
    );

    const renderExpenseCard = (registration, isPaid) => {
        const isOverdue = !isPaid && new Date(registration.game_payment_deadline) < today;
        return (
            <div key={registration.id} className="rounded-4 border p-3 mb-3 shadow-sm bg-white">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div className="fw-bold">{registration.game_modality || 'Jogo'}</div>
                        <div className="text-muted small">{registration.game_location || 'Local não definido'}</div>
                    </div>
                    <span className={`badge ${isPaid ? 'bg-success' : isOverdue ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Por pagar'}
                    </span>
                </div>
                <div className="row gx-2 gy-2 mb-2 small text-secondary">
                    <div className="col-6">Data: {registration.game_date || '-'}</div>
                    <div className="col-6">Hora: {registration.game_time?.slice(0,5) || '-'}</div>
                    <div className="col-6">Valor: R$ {registration.game_price ?? '0.00'}</div>
                    <div className="col-6">Posição: {registration.position_id || 'N/A'}</div>
                    <div className="col-6">Limite de pagamento: {registration.game_payment_deadline || '-'}</div>
                </div>
                <div className="text-muted" style={{ fontSize: '0.95rem' }}>
                    {isPaid
                        ? 'Comprovativo: inscrição aprovada e pagamento registado.'
                        : isOverdue
                            ? 'O pagamento ainda não foi efetuado e o prazo já expirou.'
                            : 'Aguarda pagamento para confirmar a inscrição.'}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-5" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Dinheiro</h4>
                        <p className="text-muted mb-0">As suas despesas para pagar e os comprovativos de jogos pagos.</p>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-4 flex-wrap">
                    <button
                        className={`btn flex-fill ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Jogos por pagar ({pendingExpenses.length})
                    </button>
                    <button
                        className={`btn flex-fill ${activeTab === 'overdue' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab('overdue')}
                    >
                        Jogos não pagos ({overdueExpenses.length})
                    </button>
                    <button
                        className={`btn flex-fill ${activeTab === 'paid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab('paid')}
                    >
                        Jogos pagos ({paidExpenses.length})
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5 text-secondary">Carregando despesas...</div>
                ) : error ? (
                    <div className="alert alert-danger py-3">{error}</div>
                ) : (
                    <>
                        {activeTab === 'pending' ? (
                            pendingExpenses.length === 0 ? (
                                <div className="text-center text-secondary py-5">
                                    Não há jogos por pagar no momento.
                                </div>
                            ) : (
                                pendingExpenses.map(registration => renderExpenseCard(registration, false))
                            )
                        ) : activeTab === 'overdue' ? (
                            overdueExpenses.length === 0 ? (
                                <div className="text-center text-secondary py-5">
                                    Não há jogos não pagos com prazo vencido.
                                </div>
                            ) : (
                                overdueExpenses.map(registration => renderExpenseCard(registration, false))
                            )
                        ) : paidExpenses.length === 0 ? (
                            <div className="text-center text-secondary py-5">
                                Não há jogos pagos ainda.
                            </div>
                        ) : (
                            paidExpenses.map(registration => renderExpenseCard(registration, true))
                        )}
                    </>
                )}
            </div>
            <BottomNavBar />
        </div>
    );
};

export default FinancePage;
