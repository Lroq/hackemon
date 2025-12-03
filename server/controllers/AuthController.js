const {
  loginUser,
  setUsersStorage: setLoginUsersStorage,
} = require('../js/login');
const {
  registerUser,
  setUsersStorage: setRegisterUsersStorage,
  getUserIdCounter,
} = require('../js/register');
const User = require('../models/User');

// Stockage en mémoire des utilisateurs (partagé avec les modules login et register)
const users = new Map();
let userIdCounter = 1;

// Synchroniser le stockage avec les modules
setLoginUsersStorage(users);
setRegisterUsersStorage(users, userIdCounter);

class AuthController {
  /**
   * Gère la connexion utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async login(req, res) {
    try {
      const credentials = req.body;
      const result = await loginUser(credentials);

      if (result.success) {
        // Réponse avec les tokens JWT
        res.json({
          success: true,
          message: result.message,
          user: result.user,
          tokens: result.tokens,
        });
      } else {
        const statusCode =
          result.code === 'MISSING_FIELDS'
            ? 400
            : result.code === 'INVALID_CREDENTIALS'
            ? 401
            : 500;
        res.status(statusCode).json({
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      console.error('Erreur dans AuthController.login:', error);
      res.status(500).json({
        error: 'Erreur serveur lors de la connexion.',
        code: 'SERVER_ERROR',
      });
    }
  }

  /**
   * Gère l'inscription utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async register(req, res) {
    try {
      const userData = req.body;
      const result = await registerUser(userData);

      if (result.success) {
        // Mettre à jour le compteur global
        userIdCounter = getUserIdCounter();
        res.status(201).json({
          success: true,
          message: result.message,
          user: result.user,
          tokens: result.tokens,
        });
      } else {
        const statusCode =
          result.code === 'MISSING_FIELDS'
            ? 400
            : result.code === 'INVALID_PASSWORD'
            ? 400
            : result.code === 'USER_EXISTS'
            ? 409
            : 500;
        res.status(statusCode).json({
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      console.error('Erreur dans AuthController.register:', error);
      res.status(500).json({
        error: "Erreur serveur lors de l'inscription.",
        code: 'SERVER_ERROR',
      });
    }
  }

  /**
   * Gère la déconnexion utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async logout(req, res) {
    try {
      // Efface la session si elle existe
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
          }
        });
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        error: 'Erreur serveur lors de la déconnexion.',
        code: 'SERVER_ERROR',
      });
    }
  }

  /**
   * Récupère le profil de l'utilisateur connecté (nécessite le middleware JWT)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getProfile(req, res) {
    try {
      let userData = users.get(req.session.userId);

      if (!userData && req.session && req.session.userId) {
        const userDoc = await User.findOne({ UUID: req.session.userId }).lean();
        if (userDoc) {
          userData = {
            UUID: userDoc.UUID,
            username: userDoc.username,
            email: userDoc.email,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
            level: userDoc.level,
          };
          try {
            users.set(userDoc.UUID, userData);
          } catch (e) {}
        }
      }

      if (!userData) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé.',
          code: 'USER_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        user: {
          UUID: userData.UUID,
          username: userData.username,
          email: userData.email,
          level: userData.level,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        error: 'Erreur serveur lors de la récupération du profil.',
        code: 'SERVER_ERROR',
      });
    }
  }

  /**
   * Renouvelle un token d'accès
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await refreshAccessToken({ refreshToken });

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          tokens: result.tokens,
        });
      } else {
        const statusCode =
          result.code === 'MISSING_REFRESH_TOKEN'
            ? 400
            : result.code === 'INVALID_REFRESH_TOKEN'
            ? 401
            : result.code === 'USER_NOT_FOUND'
            ? 404
            : result.code === 'UNAUTHORIZED_REFRESH_TOKEN'
            ? 401
            : 500;
        res.status(statusCode).json({
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      console.error('Erreur lors du renouvellement du token:', error);
      res.status(500).json({
        error: 'Erreur serveur lors du renouvellement du token.',
        code: 'SERVER_ERROR',
      });
    }
  }

  /**
   * Vérifie le statut du token (remplace checkSession)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static checkTokenStatus(req, res) {
    // Utilise le middleware optionalAuthenticateJWT
    const isAuthenticated = !!req.user;

    res.json({
      isAuthenticated,
      user: req.user || null,
    });
  }
}

module.exports = AuthController;
