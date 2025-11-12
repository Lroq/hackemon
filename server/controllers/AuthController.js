const { loginUser, setUsersStorage: setLoginUsersStorage } = require('../js/login');
const { registerUser, setUsersStorage: setRegisterUsersStorage, getUserIdCounter } = require('../js/register');
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
                // Créer la session
                req.session.userId = result.user.id;
                res.json(result);
            } else {
                const statusCode = result.code === 'MISSING_FIELDS' ? 400 : 
                                result.code === 'INVALID_CREDENTIALS' ? 400 : 500;
                res.status(statusCode).json({
                    error: result.error,
                    code: result.code
                });
            }

        } catch (error) {
            console.error("Erreur dans AuthController.login:", error);
            res.status(500).json({ 
                error: "Erreur serveur lors de la connexion.", 
                code: "SERVER_ERROR" 
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
                res.status(201).json(result);
            } else {
                const statusCode = result.code === 'MISSING_FIELDS' ? 400 :
                                result.code === 'INVALID_PASSWORD' ? 400 :
                                result.code === 'USER_EXISTS' ? 400 : 500;
                res.status(statusCode).json({
                    error: result.error,
                    code: result.code
                });
            }

        } catch (error) {
            console.error("Erreur dans AuthController.register:", error);
            res.status(500).json({ 
                error: "Erreur serveur lors de l'inscription.", 
                code: "SERVER_ERROR" 
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
            req.session.destroy((error) => {
                if (error) {
                    console.error("Erreur lors de la déconnexion:", error);
                    return res.status(500).json({ 
                        error: "Erreur lors de la déconnexion.", 
                        code: "SERVER_ERROR" 
                    });
                }

                res.clearCookie('connect.sid'); // Nom du cookie par défaut d'express-session
                res.json({ 
                    success: true, 
                    message: "Déconnexion réussie." 
                });
            });
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            res.status(500).json({ 
                error: "Erreur serveur lors de la déconnexion.", 
                code: "SERVER_ERROR" 
            });
        }
    }

    /**
     * Récupère le profil de l'utilisateur connecté
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
                        level: userDoc.level
                    };
                    try { users.set(userDoc.UUID, userData); } catch (e) {}
                }
            }

            if (!userData) {
                return res.status(404).json({ 
                    error: "Utilisateur non trouvé.", 
                    code: "USER_NOT_FOUND" 
                });
            }

            res.json({
                success: true,
                user: {
                    id: req.session.userId,
                    username: userData.username,
                    email: userData.email,
                    createdAt: userData.createdAt,
                    updatedAt: userData.updatedAt
                }
            });

        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
            res.status(500).json({ 
                error: "Erreur serveur lors de la récupération du profil.", 
                code: "SERVER_ERROR" 
            });
        }
    }

    /**
     * Vérifie le statut de la session
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    static checkSession(req, res) {
        const isLoggedIn = !!req.session.userId;
        
        res.json({
            isLoggedIn,
            userId: req.session.userId || null
        });
    }
}

module.exports = AuthController;
