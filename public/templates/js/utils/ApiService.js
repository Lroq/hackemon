/**
 * Service pour les appels API vers le serveur avec sécurité renforcée
 */
class ApiService {
  static TOKEN_KEY = 'auth_token';
  static REFRESH_TOKEN_KEY = 'refresh_token';
  static MAX_RETRIES = 3;
  static RETRY_DELAY = 1000; // ms

  /**
   * Récupère le token d'authentification
   * @private
   * @returns {string|null}
   */
  static getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Stocke le token d'authentification
   * @private
   * @param {string} token
   */
  static setToken(token) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Supprime le token d'authentification
   * @private
   */
  static clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Construit les headers sécurisés pour les requêtes
   * @private
   * @param {boolean} includeAuth - Inclure le token d'authentification
   * @returns {Object}
   */
  static buildHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Protection CSRF basique
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Sanitize les entrées utilisateur
   * @private
   * @param {string} input
   * @returns {string}
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .trim()
      .replace(/[<>]/g, '') // Retire les balises HTML basiques
      .substring(0, 1000); // Limite la longueur
  }

  /**
   * Valide les données avant envoi
   * @private
   * @param {Object} data
   * @returns {Object}
   */
  static validateAndSanitize(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Gère les erreurs de réponse
   * @private
   * @param {Response} response
   */
  static async handleErrorResponse(response) {
    const text = await response.text();

    try {
      const errorData = JSON.parse(text);

      // Déconnexion si token invalide
      if (response.status === 401) {
        this.clearToken();

        // Rediriger vers la page de connexion si nécessaire
        if (window.location.pathname !== '/login') {
          // Vous pouvez déclencher un événement personnalisé
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }

      throw new Error(
        errorData.error ||
          errorData.message ||
          `Erreur serveur (${response.status})`
      );
    } catch (parseError) {
      throw new Error(text || `Erreur serveur (${response.status})`);
    }
  }

  /**
   * Effectue une requête avec retry automatique
   * @private
   * @param {Function} requestFn - Fonction de requête à exécuter
   * @param {number} retries - Nombre de tentatives restantes
   * @returns {Promise<Response>}
   */
  static async fetchWithRetry(requestFn, retries = this.MAX_RETRIES) {
    try {
      const response = await requestFn();

      // Retry sur erreur serveur (5xx) uniquement
      if (response.status >= 500 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.fetchWithRetry(requestFn, retries - 1);
      }

      return response;
    } catch (error) {
      if (retries > 0 && error.message.includes('Failed to fetch')) {
        // Erreur réseau, on réessaye
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.fetchWithRetry(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Effectue une requête POST vers l'API
   * @param {string} endpoint - L'endpoint de l'API
   * @param {Object} data - Les données à envoyer
   * @param {boolean} requireAuth - Requiert une authentification
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async post(endpoint, data, requireAuth = false) {
    try {
      // Validation et sanitization
      const sanitizedData = this.validateAndSanitize(data);

      const response = await this.fetchWithRetry(() =>
        fetch(endpoint, {
          method: 'POST',
          headers: this.buildHeaders(requireAuth),
          body: JSON.stringify(sanitizedData),
          credentials: 'same-origin', // Envoie les cookies (pour CSRF token)
        })
      );

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const result = await response.json();

      // Normaliser différentes formes de token renvoyées par le serveur
      const tokenCandidate =
        result.token ||
        (result.tokens && (result.tokens.accessToken || result.tokens.token)) ||
        result.accessToken ||
        null;
      if (tokenCandidate) this.setToken(tokenCandidate);

      // Stocker refresh token si présent
      const refreshCandidate =
        result.refreshToken ||
        (result.tokens && result.tokens.refreshToken) ||
        null;
      if (refreshCandidate)
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshCandidate);

      return result;
    } catch (error) {
      console.error(`Erreur lors de l'appel API ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Effectue une requête GET vers l'API
   * @param {string} endpoint - L'endpoint de l'API
   * @param {boolean} requireAuth - Requiert une authentification
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async get(endpoint, requireAuth = false) {
    try {
      const response = await this.fetchWithRetry(() =>
        fetch(endpoint, {
          method: 'GET',
          headers: this.buildHeaders(requireAuth),
          credentials: 'same-origin',
        })
      );

      if (!response.ok) {
        await this.handleErrorResponse(response);
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
  static async login(identifier, password) {
    // Validation basique côté client
    if (!identifier || !password) {
      throw new Error('Identifiant et mot de passe requis');
    }

    if (password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Si l'identifiant ressemble à un email, valider son format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let payload;
    if (identifier.includes('@')) {
      if (!emailRegex.test(identifier))
        throw new Error("Format d'email invalide");
      payload = { email: identifier, password };
    } else {
      // Accepte un pseudo (username)
      payload = { username: identifier, password };
    }

    const result = await this.post('/login', payload);

    // Stocker le token si la connexion réussit
    if (result.success && result.token) {
      this.setToken(result.token);
      if (result.refreshToken) {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, result.refreshToken);
      }
    }

    return result;
  }

  /**
   * Inscription utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Résultat de l'inscription
   */
  static async register(email, username, password) {
    // Validation basique côté client
    if (!email || !username || !password) {
      throw new Error('Tous les champs sont requis');
    }

    if (username.length < 3) {
      throw new Error(
        "Le nom d'utilisateur doit contenir au moins 3 caractères"
      );
    }

    if (password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Format d'email invalide");
    }

    // Vérification complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new Error(
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      );
    }

    const result = await this.post('/register', { email, username, password });

    // Auto-connexion après inscription si token fourni
    if (result.success && result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  /**
   * Récupération du profil utilisateur
   * @returns {Promise<Object>} Profil de l'utilisateur
   */
  static async getProfile() {
    return this.get('/profile', true); // Requiert authentification
  }

  /**
   * Déconnexion utilisateur
   * @returns {Promise<Object>}
   */
  static async logout() {
    try {
      // Appel au serveur pour invalider le token
      await this.post('/logout', {}, true);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      this.clearToken();
    }
  }

  /**
   * Rafraîchit le token d'authentification
   * @returns {Promise<boolean>}
   */
  static async refreshToken() {
    try {
      const refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const result = await this.post('/refresh-token', { refreshToken });

      if (result.success && result.token) {
        this.setToken(result.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      this.clearToken();
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean}
   */
  static isAuthenticated() {
    return !!this.getToken();
  }
}

// Export pour utilisation globale
window.ApiService = ApiService;
