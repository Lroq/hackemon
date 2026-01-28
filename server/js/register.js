const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { addRefreshToken } = require('../utils/userTokenManager');

// Stockage en mémoire des utilisateurs (partagé avec AuthController)
let users = new Map();
let userIdCounter = 1;

const setUsersStorage = (usersMap, counter = 1) => {
  if (usersMap && typeof usersMap.set === 'function') users = usersMap;
  if (typeof counter === 'number') userIdCounter = counter;
};

const getUserIdCounter = () => userIdCounter;

const PASSWORD_REGEX = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{12,}/;

async function registerUser(userData) {
  try {
    const { username, email, password } = userData || {};

    if (!username || !email || !password) {
      return {
        success: false,
        error: 'Tous les champs sont requis.',
        code: 'MISSING_FIELDS',
      };
    }

    if (!PASSWORD_REGEX.test(password)) {
      return {
        success: false,
        error: 'Mot de passe invalide.',
        code: 'INVALID_PASSWORD',
      };
    }

    // Vérifier si l'utilisateur existe déjà en base
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();
    if (existing) {
      return {
        success: false,
        error: 'Un utilisateur avec cet email/nom existe déjà.',
        code: 'USER_EXISTS',
      };
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Générer UUID sans dépendance ESM
    let userUUID = null;
    try {
      const crypto = require('crypto');
      if (typeof crypto.randomUUID === 'function')
        userUUID = crypto.randomUUID();
    } catch (e) {}
    if (!userUUID)
      userUUID = 'id-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    // Sauvegarder l'utilisateur en base
    const userDoc = new User({
      UUID: userUUID,
      username,
      email,
      hashpassword: hashedPassword,
      level: 1,
      role: 'user',
    });
    let savedUser;
    try {
      savedUser = await userDoc.save();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde en base:', err);
      if (err.name === 'MongoServerError' && err.code === 11000) {
        return {
          success: false,
          error: 'Un utilisateur avec cet email existe déjà.',
          code: 'USER_EXISTS',
        };
      }
      return {
        success: false,
        error: "Erreur serveur lors de l'inscription.",
        code: 'SERVER_ERROR',
      };
    }

    // Générer tokens
    const accessToken = generateAccessToken({
      UUID: savedUser.UUID,
      username: savedUser.username,
      email: savedUser.email,
      level: savedUser.level,
      role: savedUser.role,
    });
    const refreshToken = generateRefreshToken({
      UUID: savedUser.UUID,
      username: savedUser.username,
    });

    // Essayer de persister le refresh token via userTokenManager (si disponible)
    try {
      if (typeof addRefreshToken === 'function') {
        await addRefreshToken(savedUser.UUID, refreshToken);
      }
    } catch (e) {
      console.warn(
        "Impossible d'ajouter le refresh token:",
        e && e.message ? e.message : e
      );
    }

    // Mettre à jour le stockage en mémoire
    try {
      users.set(savedUser.UUID, {
        UUID: savedUser.UUID,
        username: savedUser.username,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        level: savedUser.level,
        role: savedUser.role,
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Inscription réussie. Vous pouvez maintenant vous connecter.',
      user: {
        UUID: savedUser.UUID,
        username: savedUser.username,
        email: savedUser.email,
        level: savedUser.level,
        role: savedUser.role,
      },
      tokens: { accessToken, refreshToken },
      token: accessToken,
    };
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return {
      success: false,
      error: "Erreur serveur lors de l'inscription.",
      code: 'SERVER_ERROR',
    };
  }
}

module.exports = {
  registerUser,
  setUsersStorage,
  getUserIdCounter,
};
