const { verifyToken } = require('../config/jwt');

/**
 * Middleware pour vérifier l'authentification JWT
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const authenticateJWT = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token d'accès requis",
        code: 'MISSING_TOKEN',
      });
    }

    // Vérifier le token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
        code: 'INVALID_TOKEN',
      });
    }

    // Ajouter les informations utilisateur à la requête
    // Normaliser les différents noms de claim (userId vs UUID)
    req.user = {
      userId: decoded.userId || decoded.id || decoded.UUID || null,
      UUID: decoded.UUID || decoded.userId || decoded.id || null,
      username: decoded.username || null,
      email: decoded.email || null,
      level: decoded.level || null,
    };

    next();
  } catch (error) {
    console.error('Erreur dans le middleware JWT:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification du token',
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Middleware optionnel pour vérifier l'authentification JWT (ne bloque pas si pas de token)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const optionalAuthenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          UUID: decoded.UUID,
          username: decoded.username,
          email: decoded.email,
          level: decoded.level,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Erreur dans le middleware JWT optionnel:', error);
    next();
  }
};

module.exports = {
  authenticateJWT,
  optionalAuthenticateJWT,
};
