/**
 * Middleware d'authentification
 */

/**
 * Vérifie si l'utilisateur est authentifié
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express  
 * @param {Function} next - Fonction next
 */
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: "Accès non autorisé. Veuillez vous connecter.", 
            code: "UNAUTHORIZED" 
        });
    }
    next();
};

/**
 * Middleware optionnel pour récupérer l'utilisateur si connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const optionalAuth = (req, res, next) => {
    // Ajoute l'ID utilisateur à la requête s'il existe
    req.userId = req.session.userId || null;
    next();
};

/**
 * Middleware pour vérifier les permissions administrateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                error: "Accès non autorisé.", 
                code: "UNAUTHORIZED" 
            });
        }

        // Pour la version sans DB, on considère que tous les utilisateurs connectés sont admins
        // ou on peut créer une liste d'admins en dur
        const adminUsers = [1]; // Premier utilisateur créé est admin
        
        if (!adminUsers.includes(req.session.userId)) {
            return res.status(403).json({ 
                error: "Permissions administrateur requises.", 
                code: "FORBIDDEN" 
            });
        }

        next();
    } catch (error) {
        console.error('Erreur dans requireAdmin:', error);
        res.status(500).json({ 
            error: "Erreur serveur lors de la vérification des permissions.", 
            code: "SERVER_ERROR" 
        });
    }
};

/**
 * Middleware pour logger les requêtes d'authentification
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const logAuthAttempt = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] Tentative d'authentification depuis ${ip} - ${userAgent}`);
    next();
};

module.exports = {
    requireAuth,
    optionalAuth,
    requireAdmin,
    logAuthAttempt
};
