const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';

/**
 * Extrait le token depuis l'en-tête Authorization
 * @param {Object} req - Requête Express
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Accès non autorisé. Veuillez vous connecter.',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('requireAuth: token present, decoded:', decoded);
    next();
  } catch (error) {
    console.error('Erreur de vérification JWT:', error.message);
    res.status(401).json({
      error: 'Token invalide ou expiré.',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Middleware optionnel pour récupérer l'utilisateur si connecté
 */
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    req.user = null;
  }
  next();
};

/**
 * Middleware pour vérifier les permissions administrateur
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Accès non autorisé.',
        code: 'UNAUTHORIZED',
      });
    }

    const adminUsers = [1]; // Premier utilisateur créé est admin

    if (!adminUsers.includes(req.user.userId)) {
      return res.status(403).json({
        error: 'Permissions administrateur requises.',
        code: 'FORBIDDEN',
      });
    }

    next();
  } catch (error) {
    console.error('Erreur dans requireAdmin:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la vérification des permissions.',
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Middleware pour logger les requêtes d'authentification
 */
const logAuthAttempt = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(
    `[${timestamp}] Tentative d'authentification depuis ${ip} - ${userAgent}`
  );
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  logAuthAttempt,
};
