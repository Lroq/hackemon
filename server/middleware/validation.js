/**
 * 🛡️ Middleware de validation des données
 * Validation propre et sécurisée des entrées utilisateur
 */

// ========================================
// 📋 TYPES DE VALIDATION D'ERREURS
// ========================================

const ValidationErrors = {
  // Erreurs de champs requis
  MISSING_USERNAME: {
    code: "MISSING_USERNAME",
    message: "👤 Veuillez saisir un nom d'utilisateur",
    field: "username",
  },
  MISSING_EMAIL: {
    code: "MISSING_EMAIL",
    message: "📧 Veuillez saisir une adresse email",
    field: "email",
  },
  MISSING_PASSWORD: {
    code: "MISSING_PASSWORD",
    message: "🔐 Veuillez saisir un mot de passe",
    field: "password",
  },

  // Erreurs de format
  INVALID_USERNAME_LENGTH: {
    code: "INVALID_USERNAME_LENGTH",
    message: "📏 Le nom d'utilisateur doit contenir entre 3 et 20 caractères",
    field: "username",
  },
  INVALID_USERNAME_FORMAT: {
    code: "INVALID_USERNAME_FORMAT",
    message:
      "🔤 Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores",
    field: "username",
  },
  INVALID_EMAIL_FORMAT: {
    code: "INVALID_EMAIL_FORMAT",
    message: "📮 L'adresse email n'est pas au bon format",
    field: "email",
  },
  WEAK_PASSWORD: {
    code: "WEAK_PASSWORD",
    message:
      "🚨 Le mot de passe doit contenir au moins 12 caractères avec majuscules, minuscules, chiffres et symboles",
    field: "password",
    requirements: [
      "Au moins 12 caractères",
      "Une lettre majuscule (A-Z)",
      "Une lettre minuscule (a-z)",
      "Un chiffre (0-9)",
      "Un caractère spécial (!@#$%...)",
    ],
  },
};

// ========================================
// 🔍 VALIDATEURS SPÉCIALISÉS
// ========================================

/**
 * Valide le format d'un email
 * @param {string} email - Email à valider
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valide le format du nom d'utilisateur
 * @param {string} username - Nom d'utilisateur à valider
 * @returns {Object} { isValid: boolean, error?: Object }
 */
const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: ValidationErrors.MISSING_USERNAME };
  }

  const cleanUsername = username.trim();

  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return { isValid: false, error: ValidationErrors.INVALID_USERNAME_LENGTH };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { isValid: false, error: ValidationErrors.INVALID_USERNAME_FORMAT };
  }

  return { isValid: true, value: cleanUsername };
};

/**
 * Valide le format de l'email
 * @param {string} email - Email à valider
 * @returns {Object} { isValid: boolean, error?: Object }
 */
const validateEmailField = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: ValidationErrors.MISSING_EMAIL };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    return { isValid: false, error: ValidationErrors.INVALID_EMAIL_FORMAT };
  }

  return { isValid: true, value: cleanEmail };
};

/**
 * Valide la force du mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {Object} { isValid: boolean, error?: Object }
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: ValidationErrors.MISSING_PASSWORD };
  }

  // Critères de sécurité renforcés
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?:{}|<>-_+=]/.test(password);

  if (
    !hasMinLength ||
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSpecialChar
  ) {
    return { isValid: false, error: ValidationErrors.WEAK_PASSWORD };
  }

  return { isValid: true };
};

// ========================================
// 🔧 MIDDLEWARES DE VALIDATION
// ========================================

/**
 * ✨ Middleware de validation pour l'inscription
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const validateRegisterData = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Validation du nom d'utilisateur
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    errors.push(usernameValidation.error);
  } else {
    req.body.username = usernameValidation.value;
  }

  // Validation de l'email
  const emailValidation = validateEmailField(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  } else {
    req.body.email = emailValidation.value;
  }

  // Validation du mot de passe
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error);
  }

  // S'il y a des erreurs, les retourner
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * 🔐 Middleware de validation pour la connexion
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const validateLoginData = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validation de l'email (moins stricte pour la connexion)
  if (!email || email.trim().length === 0) {
    errors.push(ValidationErrors.MISSING_EMAIL);
  } else if (!isValidEmail(email.trim())) {
    errors.push(ValidationErrors.INVALID_EMAIL_FORMAT);
  } else {
    req.body.email = email.trim().toLowerCase();
  }

  // Validation du mot de passe (vérification simple pour la connexion)
  if (!password) {
    errors.push(ValidationErrors.MISSING_PASSWORD);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * 🔄 Générateur de middleware pour valider des champs requis
 * @param {Array<string>} requiredFields - Liste des champs requis
 * @returns {Function} Middleware de validation
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    for (const field of requiredFields) {
      const value = req.body[field];

      if (!value || (typeof value === "string" && value.trim().length === 0)) {
        errors.push({
          code: "MISSING_FIELD",
          message: `📝 Le champ '${field}' est requis`,
          field: field,
        });
      }
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

// ========================================
// 🧹 MIDDLEWARE DE NETTOYAGE
// ========================================

/**
 * 🧹 Middleware pour nettoyer et sécuriser les entrées
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      // Nettoyer les espaces et caractères dangereux
      return value
        .trim()
        .replace(/[<>]/g, "") // Supprime les balises HTML basiques
        .replace(/javascript:/gi, "") // Supprime les injections JavaScript
        .slice(0, 1000); // Limite la taille
    } else if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item));
    } else if (typeof value === "object" && value !== null) {
      const cleaned = {};
      for (const [key, val] of Object.entries(value)) {
        // Nettoie aussi les clés d'objet
        const cleanKey = key.replace(/[<>$]/g, "").slice(0, 100);
        cleaned[cleanKey] = sanitizeValue(val);
      }
      return cleaned;
    }
    return value;
  };

  // Nettoyage des données
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// ========================================
// 📤 GESTIONNAIRE DE RÉPONSES D'ERREUR
// ========================================

/**
 * 💌 Envoie une réponse d'erreur de validation formatée
 * @param {Object} res - Réponse Express
 * @param {Array} errors - Liste des erreurs de validation
 */
const sendValidationError = (res, errors) => {
  const response = {
    success: false,
    message: "❌ Erreur de validation des données",
    errors: errors.map((error) => ({
      code: error.code,
      message: error.message,
      field: error.field,
      ...(error.requirements && { requirements: error.requirements }),
    })),
    timestamp: new Date().toISOString(),
    type: "validation_error",
  };

  return res.status(400).json(response);
};

/**
 * 🚨 Envoie une erreur simple
 * @param {Object} res - Réponse Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code de statut HTTP
 */
const sendError = (res, message, statusCode = 400) => {
  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString(),
    type: "error",
  };

  return res.status(statusCode).json(response);
};

// ========================================
// 📤 EXPORTS
// ========================================

module.exports = {
  // Middlewares principaux
  validateRegisterData,
  validateLoginData,
  validateRequiredFields,
  sanitizeInput,

  // Validateurs individuels
  validateUsername,
  validateEmailField,
  validatePassword,
  isValidEmail,

  // Gestionnaires d'erreur
  sendValidationError,
  sendError,

  // Constantes d'erreur
  ValidationErrors,
};
