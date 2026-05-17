import {createContext, useContext, useEffect, useState} from "react";
import axios from "axios";

const UserContext = createContext(null);

export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                // Vai ao Backend perguntar quem é o utilizador dono do Cookie atual
                const response = await axios.get("http://localhost:8000/api/user/");

                // Se o Django responder com sucesso (200 OK), guardamos os dados no Contexto
                setUser(response.data);
            } catch (error) {
                // Se der erro (ex: 403 Forbidden ou 401 Unauthorized), significa que o cookie expirou ou não existe
                setUser(null);
            } finally {
                // Quer tenha sucesso ou erro, terminamos a fase de "loading"
                setLoading(false);
            }
        };

        checkUserSession();
    }, []); // O array vazio garante que isto só corre 1 vez quando fazes F5

    // Enquanto estiver a verificar o cookie, mostra apenas um ecrã branco ou um texto de loading.
    // Isto impede que a página "pisque" e te atire para a LandingPage injustamente!
    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">A carregar...</span>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={ {user, setUser} }>
        {children}
        </UserContext.Provider>
    );
};

export default UserProvider;