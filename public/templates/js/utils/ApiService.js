/**
 * Service pour les appels API vers le serveur
 */
class ApiService {
    /**
     * Effectue une requête POST vers l'API
     * @param {string} endpoint - L'endpoint de l'API
     * @param {Object} data - Les données à envoyer
     * @returns {Promise<Object>} La réponse de l'API
     */
    static async post(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || `Erreur serveur (${response.status})`);
                } catch {
                    throw new Error(text || `Erreur serveur (${response.status})`);
                }
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de l'appel API ${endpoint}:` , error.message);
            throw error;
        }
    }

    /**
     * Effectue une requête GET vers l'API
     * @param {string} endpoint - L'endpoint de l'API
     * @returns {Promise<Object>} La réponse de l'API
     */
    static async get(endpoint) {
        try {
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de l'appel API ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Connexion utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Résultat de la connexion
     */
    static async login(email, password) {
        return this.post("/login", { email, password });
    }

    /**
     * Inscription utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Résultat de l'inscription
     */
    static async register(email, username, password) {
        return this.post("/register", { email, username, password });
    }

    /**
     * Récupération du profil utilisateur
     * @returns {Promise<Object>} Profil de l'utilisateur
     */
    static async getProfile() {
        return this.get("/profile");
    }
}

// Export pour utilisation globale
window.ApiService = ApiService;
