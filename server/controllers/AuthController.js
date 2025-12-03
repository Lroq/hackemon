/**
 * Contrôleur pour la gestion de l'authentification (sans base de données)
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { loginUser, setUsersStorage } = require("../js/login");
const { refreshAccessToken } = require("../js/tokenManager");

const JWT_SECRET = process.env.JWT_SECRET || "hackemon_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Stockage en mémoire des utilisateurs (partagé avec les modules login et register)
const users = new Map();
let userIdCounter = 1;

// Synchroniser le stockage avec le module de login
setUsersStorage(users);

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
        return res.json({
          success: true,
          message: result.message,
          user: result.user,
          token: result.token,
        });
      } else {
        const statusCode = result.code === "MISSING_FIELDS" ? 400 : 
                          result.code === "INVALID_CREDENTIALS" ? 400 : 500;
        return res.status(statusCode).json({
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      console.error("Erreur dans AuthController.login:", error);
      res.status(500).json({
        error: "Erreur serveur lors de la connexion.",
        code: "SERVER_ERROR",
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
      const { username, email, password } = req.body;

      console.log("Tentative d'inscription pour:", email);

      // Vérifier si l'utilisateur existe déjà
      let existingUser = null;
      for (const [id, userData] of users.entries()) {
        if (userData.email === email || userData.username === username) {
          existingUser = userData;
          break;
        }
      }

      if (existingUser) {
        const field =
          existingUser.email === email ? "email" : "nom d'utilisateur";
        return res.status(400).json({
          error: `Un utilisateur avec ce ${field} existe déjà.`,
          code: "USER_EXISTS",
        });
      }

      // Hasher le mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer le nouvel utilisateur en mémoire
      const userId = userIdCounter++;
      const newUser = {
        username,
        email,
        hashpassword: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.set(userId, newUser);

      console.log("Inscription réussie pour:", username);

      const tokenPayload = {
        userId,
        username: newUser.username,
        email: newUser.email,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.status(201).json({
        success: true,
        message: "Inscription réussie.",
        token,
        user: tokenPayload,
      });
    } catch (error) {
      console.error("Erreur dans AuthController.register:", error);
      res.status(500).json({
        error: "Erreur serveur lors de l'inscription.",
        code: "SERVER_ERROR",
      });
    }
  }

  /**
   * Gère la déconnexion utilisateur (révocation du refresh token)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async logout(req, res) {
    try {
      res.json({
        success: true,
        message: "Déconnexion réussie. Supprimez votre token côté client.",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      res.status(500).json({
        error: "Erreur serveur lors de la déconnexion.",
        code: "SERVER_ERROR",
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
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          error: "Accès non autorisé.",
          code: "UNAUTHORIZED",
        });
      }

      const userData = users.get(userId);

      if (!userData) {
        return res.status(404).json({
          error: "Utilisateur non trouvé.",
          code: "USER_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        user: {
          id: userId,
          username: userData.username,
          email: userData.email,
          level: userData.level,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(500).json({
        error: "Erreur serveur lors de la récupération du profil.",
        code: "SERVER_ERROR",
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
          result.code === "MISSING_REFRESH_TOKEN"
            ? 400
            : result.code === "INVALID_REFRESH_TOKEN"
            ? 401
            : result.code === "USER_NOT_FOUND"
            ? 404
            : result.code === "UNAUTHORIZED_REFRESH_TOKEN"
            ? 401
            : 500;
        res.status(statusCode).json({
          error: result.error,
          code: result.code,
        });
      }
    } catch (error) {
      console.error("Erreur lors du renouvellement du token:", error);
      res.status(500).json({
        error: "Erreur serveur lors du renouvellement du token.",
        code: "SERVER_ERROR",
      });
    }
  }

  /**
   * Vérifie le statut du token (remplace checkSession)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static checkSession(req, res) {
    const isLoggedIn = !!req.user;

    res.json({
      isLoggedIn,
      user: req.user || null,
    });
  }
}

module.exports = AuthController;
