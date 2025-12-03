/**
 * Contrôleur pour la gestion de l'authentification (sans base de données)
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Stockage en mémoire des utilisateurs (remplace la base de données)
const users = new Map();
let userIdCounter = 1;

class AuthController {
    /**
     * Gère la connexion utilisateur
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            console.log("Tentative de connexion pour:", email);

            // Chercher l'utilisateur dans le stockage en mémoire
            let user = null;
            for (const [id, userData] of users.entries()) {
                if (userData.email === email) {
                    user = { id, ...userData };
                    break;
                }
            }

            if (!user) {
                return res.status(400).json({ 
                    error: "Email ou mot de passe incorrect.", 
                    code: "INVALID_CREDENTIALS" 
                });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.hashpassword);
            if (!isPasswordValid) {
                return res.status(400).json({ 
                    error: "Email ou mot de passe incorrect.", 
                    code: "INVALID_CREDENTIALS" 
                });
            }

            const tokenPayload = {
                userId: user.id,
                username: user.username,
                email: user.email
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            console.log("Connexion réussie pour:", user.username);

            res.json({ 
                success: true, 
                message: "Connexion réussie.",
                token,
                user: tokenPayload
            });

        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
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
                const field = existingUser.email === email ? "email" : "nom d'utilisateur";
                return res.status(400).json({ 
                    error: `Un utilisateur avec ce ${field} existe déjà.`, 
                    code: "USER_EXISTS" 
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
                updatedAt: new Date()
            };

            users.set(userId, newUser);

            console.log("Inscription réussie pour:", username);

            const tokenPayload = {
                userId,
                username: newUser.username,
                email: newUser.email
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.status(201).json({ 
                success: true,
                message: "Inscription réussie.",
                token,
                user: tokenPayload
            });

        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            
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
            res.json({ 
                success: true, 
                message: "Déconnexion réussie. Supprimez votre token côté client." 
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
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ 
                    error: "Accès non autorisé.", 
                    code: "UNAUTHORIZED" 
                });
            }

            const userData = users.get(userId);
            
            if (!userData) {
                return res.status(404).json({ 
                    error: "Utilisateur non trouvé.", 
                    code: "USER_NOT_FOUND" 
                });
            }

            res.json({
                success: true,
                user: {
                    id: userId,
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
        const isLoggedIn = !!req.user;

        res.json({
            isLoggedIn,
            user: req.user || null
        });
    }
}

module.exports = AuthController;
