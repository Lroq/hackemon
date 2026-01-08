const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Stockage en mémoire des utilisateurs (partagé avec AuthController)
let users = new Map();

// Fonction pour définir le stockage externe (appelée depuis AuthController)
const setUsersStorage = (usersMap) => {
  if (usersMap && typeof usersMap.set === 'function') users = usersMap;
};

/**
 * Logique de connexion utilisateur
 * @param {Object} credentials - Les identifiants { email?, username?, password }
 * @returns {Object} - Résultat de la connexion
 */
const loginUser = async (credentials) => {
  try {
    const { email, username, password } = credentials || {};
    const identifier = email || username;

    console.log('Tentative de connexion pour:', identifier);

    // Validation des champs requis
    if (!identifier || !password) {
      return {
        success: false,
        error: 'Tous les champs sont requis.',
        code: 'MISSING_FIELDS',
      };
    }

    // Chercher l'utilisateur dans la base MongoDB (par email ou username)
    let user = null;
    try {
      const userDoc = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      }).lean();
      if (userDoc) {
        user = userDoc;
        console.log(
          'loginUser: trouvé en DB - UUID/_id:',
          userDoc.UUID,
          userDoc._id && userDoc._id.toString()
        );
      }
    } catch (mongoError) {
      console.log(
        'MongoDB non disponible ou erreur lors de la recherche:',
        mongoError && mongoError.message
      );
    }

    // Si pas trouvé en DB, chercher dans le stockage mémoire (par email ou username)
    if (!user) {
      for (const [id, userData] of users.entries()) {
        if (userData.email === identifier || userData.username === identifier) {
          user = { ...userData, _id: id };
          console.log('loginUser: trouvé en mémoire, key:', id);
          break;
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect.',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.hashpassword);
    if (!match) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect.',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Préparer le payload du token (préférer UUID si présent)
    const idClaim =
      user.UUID ||
      (user._id && user._id.toString()) ||
      (user.id && user.id.toString()) ||
      null;
    const tokenPayload = {
      userId: idClaim,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    console.log('loginUser: tokenPayload:', tokenPayload);

    return {
      success: true,
      token,
      user: tokenPayload,
      message: 'Connexion réussie.',
    };
  } catch (err) {
    console.error('Error processing loginUser:', err && err.message);
    return {
      success: false,
      error: 'Erreur serveur lors de la connexion.',
      code: 'SERVER_ERROR',
    };
  }
};

module.exports = {
  loginUser,
  setUsersStorage,
};
