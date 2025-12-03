/**
 * Exemple d'utilisation des JWT côté client
 */

class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:3000'; // Ajustez selon votre configuration
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    /**
     * Connexion utilisateur
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Sauvegarder les tokens
                this.accessToken = data.tokens.accessToken;
                this.refreshToken = data.tokens.refreshToken;
                
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }

        } catch (error) {
            console.error('Erreur de connexion:', error);
            return { success: false, error: 'Erreur de connexion' };
        }
    }

    /**
     * Inscription utilisateur
     */
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Sauvegarder les tokens (connexion automatique après inscription)
                this.accessToken = data.tokens.accessToken;
                this.refreshToken = data.tokens.refreshToken;
                
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }

        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            return { success: false, error: 'Erreur d\'inscription' };
        }
    }

    /**
     * Renouvellement automatique du token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            const data = await response.json();

            if (data.success) {
                this.accessToken = data.tokens.accessToken;
                this.refreshToken = data.tokens.refreshToken;
                
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);

                return true;
            } else {
                this.logout();
                return false;
            }

        } catch (error) {
            console.error('Erreur de renouvellement du token:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Effectue une requête authentifiée avec gestion automatique du token
     */
    async authenticatedRequest(url, options = {}) {
        // Ajouter le token d'accès
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers
        };

        let response = await fetch(`${this.baseURL}${url}`, {
            ...options,
            headers
        });

        // Si le token a expiré (401), essayer de le renouveler
        if (response.status === 401) {
            const refreshed = await this.refreshAccessToken();
            
            if (refreshed) {
                // Refaire la requête avec le nouveau token
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(`${this.baseURL}${url}`, {
                    ...options,
                    headers
                });
            } else {
                // Redirection vers la page de connexion si le renouvellement a échoué
                window.location.href = '/login';
                return null;
            }
        }

        return response;
    }

    /**
     * Récupère le profil utilisateur
     */
    async getProfile() {
        try {
            const response = await this.authenticatedRequest('/profile');
            
            if (response && response.ok) {
                const data = await response.json();
                return data.user;
            }

            return null;

        } catch (error) {
            console.error('Erreur de récupération du profil:', error);
            return null;
        }
    }

    /**
     * Déconnexion utilisateur
     */
    async logout() {
        try {
            if (this.refreshToken) {
                await fetch(`${this.baseURL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken: this.refreshToken })
                });
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            // Nettoyer les tokens localement
            this.accessToken = null;
            this.refreshToken = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    /**
     * Vérifie si l'utilisateur est connecté
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Décode le payload du JWT (sans vérification)
     */
    decodeToken() {
        if (!this.accessToken) return null;
        
        try {
            const base64Url = this.accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Erreur de décodage du token:', error);
            return null;
        }
    }
}

// Utilisation
const auth = new AuthService();

// Exemple d'utilisation
async function handleLogin() {
    const result = await auth.login('user@example.com', 'password123');
    if (result.success) {
        console.log('Connexion réussie:', result.user);
    } else {
        console.error('Erreur de connexion:', result.error);
    }
}

// Middleware pour vérifier l'authentification avant chaque page
document.addEventListener('DOMContentLoaded', async () => {
    const protectedPages = ['/profile', '/dashboard']; // Pages qui nécessitent une authentification
    const currentPath = window.location.pathname;
    
    if (protectedPages.includes(currentPath)) {
        if (!auth.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }
        
        // Vérifier que le token est valide en récupérant le profil
        const profile = await auth.getProfile();
        if (!profile) {
            window.location.href = '/login';
        }
    }
});

export default AuthService;
