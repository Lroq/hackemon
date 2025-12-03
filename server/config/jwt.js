const jwt = require('jsonwebtoken');

// Clé secrète pour signer les tokens (en production, utilisez une variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Durée d'expiration du token (24 heures)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Durée d'expiration du refresh token (7 jours)
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Génère un token d'accès JWT
 * @param {Object} payload - Les données à inclure dans le token
 * @returns {String} - Token JWT signé
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'hackemon-app',
        audience: 'hackemon-users'
    });
};

/**
 * Génère un refresh token JWT
 * @param {Object} payload - Les données à inclure dans le token
 * @returns {String} - Refresh token JWT signé
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'hackemon-app',
        audience: 'hackemon-users'
    });
};

/**
 * Vérifie et décode un token JWT
 * @param {String} token - Token JWT à vérifier
 * @returns {Object} - Données décodées du token ou null si invalide
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'hackemon-app',
            audience: 'hackemon-users'
        });
    } catch (error) {
        console.error('Erreur de vérification du token:', error.message);
        return null;
    }
};

/**
 * Décode un token sans vérifier la signature (pour debug)
 * @param {String} token - Token JWT à décoder
 * @returns {Object} - Données décodées du token
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN,
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};
