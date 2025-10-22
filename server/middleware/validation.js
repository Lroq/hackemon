/**
 * Middleware de validation des données
 */

/**
 * Valide les données d'inscription
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const validateRegisterData = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    // Vérification des champs requis
    if (!username || username.trim().length === 0) {
        errors.push("Le nom d'utilisateur est requis.");
    }

    if (!email || email.trim().length === 0) {
        errors.push("L'email est requis.");
    }

    if (!password) {
        errors.push("Le mot de passe est requis.");
    }

    // Validation du nom d'utilisateur
    if (username && (username.length < 3 || username.length > 20)) {
        errors.push("Le nom d'utilisateur doit contenir entre 3 et 20 caractères.");
    }

    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.");
    }

    // Validation de l'email
    if (email && !isValidEmail(email)) {
        errors.push("Format d'email invalide.");
    }

    // Validation du mot de passe
    if (password && password.length < 6) {
        errors.push("Le mot de passe doit contenir au moins 6 caractères.");
    }

    // Version plus stricte du mot de passe (optionnelle)
    // const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{12,}/;
    // if (password && !passwordRegex.test(password)) {
    //     errors.push("Le mot de passe doit contenir au moins 12 caractères, un chiffre, une lettre majuscule, une lettre minuscule et un caractère spécial.");
    // }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: errors.join(' '), 
            code: "VALIDATION_ERROR",
            details: errors 
        });
    }

    // Nettoyer les données
    req.body.username = username.trim();
    req.body.email = email.trim().toLowerCase();

    next();
};

/**
 * Valide les données de connexion
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const validateLoginData = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim().length === 0) {
        errors.push("L'email est requis.");
    }

    if (!password) {
        errors.push("Le mot de passe est requis.");
    }

    if (email && !isValidEmail(email)) {
        errors.push("Format d'email invalide.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: errors.join(' '), 
            code: "VALIDATION_ERROR",
            details: errors 
        });
    }

    // Nettoyer les données
    req.body.email = email.trim().toLowerCase();

    next();
};

/**
 * Middleware de validation générale pour les champs requis
 * @param {Array} requiredFields - Liste des champs requis
 * @returns {Function} Middleware Express
 */
const validateRequiredFields = (requiredFields) => {
    return (req, res, next) => {
        const errors = [];

        for (const field of requiredFields) {
            if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim().length === 0)) {
                errors.push(`Le champ '${field}' est requis.`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                error: errors.join(' '), 
                code: "VALIDATION_ERROR",
                details: errors 
            });
        }

        next();
    };
};

/**
 * Vérifie si l'email est valide
 * @param {string} email - Email à vérifier
 * @returns {boolean} True si l'email est valide
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Middleware pour sanitiser les données d'entrée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const sanitizeInput = (req, res, next) => {
    // Fonction récursive pour nettoyer les objets
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.trim();
        } else if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitize(req.body);
    next();
};

module.exports = {
    validateRegisterData,
    validateLoginData,
    validateRequiredFields,
    sanitizeInput
};
