import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Input, Row, Col } from 'reactstrap';
import TopNavBarSimple from '../components/TopNavBarSimple';
import BottomNavBar from '../components/BottomNavBar';
import MatchCard from '../components/MatchCard';

const SearchPage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('matchup_user_id');

    const [allGames, setAllGames] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);

    // Estados dos Filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [modalityFilter, setModalityFilter] = useState('Todas');
    const [dateFilter, setDateFilter] = useState('Todas');

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }
        fetchAllGames();
    }, [userId, navigate]);

    const fetchAllGames = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/games/');
            const jogos = response.data.reverse();
            
            const agora = new Date();
            const jogosFuturos = jogos.filter(g => new Date(`${g.date}T${g.time}`) >= agora);

            setAllGames(jogosFuturos);
            setFilteredGames(jogosFuturos);
        } catch (error) {
            console.error("Erro ao carregar os jogos:", error);
        }
    };

    useEffect(() => {
        let resultados = allGames;

        // 1. Filtro de Campo
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            resultados = resultados.filter(g => g.location.toLowerCase().includes(query));
        }

        // 2. Filtro de Modalidade
        if (modalityFilter !== 'Todas') {
            resultados = resultados.filter(g => g.modality === modalityFilter);
        }

        // 3. Filtro de Data
        if (dateFilter !== 'Todas') {
            // Cria a data de "Hoje" à meia-noite exata para fazer contas certas
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            resultados = resultados.filter(g => {
                const dataJogo = new Date(`${g.date}T00:00:00`);

                if (dateFilter === 'Hoje') {
                    return dataJogo.getTime() === hoje.getTime();
                } 
                else if (dateFilter === 'Amanha') {
                    const amanha = new Date(hoje);
                    amanha.setDate(amanha.getDate() + 1);
                    return dataJogo.getTime() === amanha.getTime();
                } 
                else if (dateFilter === 'ProximaSemana') {
                    const proximaSemana = new Date(hoje);
                    proximaSemana.setDate(proximaSemana.getDate() + 7);
                    return dataJogo >= hoje && dataJogo <= proximaSemana;
                } 
                else if (dateFilter === 'ProximoMes') {
                    const proximoMes = new Date(hoje);
                    proximoMes.setDate(proximoMes.getDate() + 30);
                    return dataJogo >= hoje && dataJogo <= proximoMes;
                }
                return true;
            });
        }

        setFilteredGames(resultados);
    }, [searchQuery, modalityFilter, dateFilter, allGames]);

    return (
        <div className="bg-light min-vh-100 pb-5">
            <TopNavBarSimple />

            <Container className="pt-4 pb-5 mb-5">
                <h3 className="fw-bold mb-4 text-center">Explorar Match's</h3>

                {/* ZONA DE PESQUISA E FILTROS */}
                <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
                    
                    <div className="position-relative mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                        <Input 
                            type="text" 
                            placeholder="Onde queres jogar?" 
                            className="rounded-pill shadow-none bg-light ps-5 py-2 border-0 fw-semibold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Row className="gx-2">
                        <Col xs={6}>
                            <Input 
                                type="select" 
                                className="rounded-pill shadow-none bg-light border-0 fw-semibold text-muted text-truncate"
                                value={modalityFilter}
                                onChange={(e) => setModalityFilter(e.target.value)}
                            >
                                <option value="Todas">Qualquer Modalidade</option>
                                <option value="Futebol">Futebol</option>
                                <option value="Basketball">Basketball</option>
                            </Input>
                        </Col>
                        <Col xs={6}>
                            <Input 
                                type="select" 
                                className="rounded-pill shadow-none bg-light border-0 fw-semibold text-muted text-truncate"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="Todas">Qualquer Data</option>
                                <option value="Hoje">Hoje</option>
                                <option value="Amanha">Amanhã</option>
                                <option value="ProximaSemana">Próxima Semana</option>
                                <option value="ProximoMes">Próximo Mês</option>
                            </Input>
                        </Col>
                    </Row>
                </div>

                {/* RESULTADOS DA PESQUISA */}
                <div className="mb-2 d-flex justify-content-between align-items-end px-1">
                    <h6 className="fw-bold m-0 text-secondary">Resultados ({filteredGames.length})</h6>
                </div>

                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        {filteredGames.length > 0 ? (
                            filteredGames.map(game => (
                                <div key={game.id} className="mb-3">
                                    <MatchCard game={game} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-secondary mb-3 opacity-50" viewBox="0 0 16 16">
                                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                </svg>
                                <h5 className="fw-bold text-muted">Nenhum Match encontrado</h5>
                                <p className="text-muted small">Tenta ajustar os filtros ou pesquisar noutro local.</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <BottomNavBar />
        </div>
    );
};

export default SearchPage;