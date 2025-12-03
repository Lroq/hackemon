const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { 
    findUserByEmail, 
    addRefreshToken 
} = require('../utils/userTokenManager');

// Stockage en mémoire des utilisateurs (partagé avec AuthController)
let users = new Map();

// Fonction pour définir le stockage externe (appelée depuis AuthController)
const setUsersStorage = (usersMap) => {
    users = usersMap;
};

/**
 * Logique de connexion utilisateur
 * @param {Object} credentials - Les identifiants {email, password}
 * @returns {Object} - Résultat de la connexion
 */
const loginUser = async (credentials) => {
    try {
        const { email, password } = credentials;

        console.log("Tentative de connexion pour:", email);

        // Validation des champs requis
        if (!email || !password) {
            return {
                success: false,
                error: "Tous les champs sont requis.",
                code: "MISSING_FIELDS"
            };
        }

        // Chercher l'utilisateur dans la base MongoDB
        const userDoc = await User.findOne({ email }).lean();

        if (!userDoc) {
            // Chercher l'utilisateur dans le fichier JSON
            const user = findUserByEmail(email);

            if (!user) {
                return {
                    success: false,
                    error: "Email ou mot de passe incorrect.",
                    code: "INVALID_CREDENTIALS"
                };
            }

            // Vérifier le mot de passe pour l'utilisateur du fichier JSON
            const isPasswordValid = await bcrypt.compare(password, user.hashpassword);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: "Email ou mot de passe incorrect.",
                    code: "INVALID_CREDENTIALS"
                };
            }

            // Générer les tokens JWT pour l'utilisateur du fichier JSON
            const accessToken = generateAccessToken({
                UUID: user.UUID,
                username: user.username,
                email: user.email,
                level: user.level
            });

            const refreshToken = generateRefreshToken({
                UUID: user.UUID,
                username: user.username
            });

            // Mettre à jour les tokens de l'utilisateur dans le fichier JSON
            const tokenAdded = addRefreshToken(user.UUID, refreshToken);
            
            if (!tokenAdded) {
                console.warn("Impossible d'ajouter le refresh token au fichier, mais connexion réussie");
            }

            console.log("Connexion réussie pour:", user.username);

            return {
                success: true,
                message: "Connexion réussie.",
                user: {
                    UUID: user.UUID,
                    username: user.username,
                    email: user.email,
                    level: user.level
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            };
        }

        // Vérifier le mot de passe pour l'utilisateur de MongoDB
        const isPasswordValid = await bcrypt.compare(password, userDoc.hashpassword);
        if (!isPasswordValid) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        // Mettre à jour en mémoire 
        try {
            users.set(userDoc.UUID, {
                UUID: userDoc.UUID,
                username: userDoc.username,
                email: userDoc.email,
                hashpassword: userDoc.hashpassword,
                level: userDoc.level,
                createdAt: userDoc.createdAt,
                updatedAt: userDoc.updatedAt
            });
        } catch (e) {
            // ignore
        }

        console.log("Connexion réussie pour:", userDoc.username);

        // Générer les tokens JWT
        const accessToken = generateAccessToken({
            UUID: userDoc.UUID,
            username: userDoc.username,
            email: userDoc.email,
            level: userDoc.level
        });

        const refreshToken = generateRefreshToken({
            UUID: userDoc.UUID,
            username: userDoc.username
        });

        // Mettre à jour les tokens de l'utilisateur
        const tokenAdded = addRefreshToken(userDoc.UUID, refreshToken);
        
        if (!tokenAdded) {
            console.warn("Impossible d'ajouter le refresh token, mais connexion réussie");
        }

        return {
            success: true,
            message: "Connexion réussie.",
            user: {
                UUID: userDoc.UUID,
                username: userDoc.username,
                email: userDoc.email,
                level: userDoc.level
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };

    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        return {
            success: false,
            error: "Erreur serveur lors de la connexion.",
            code: "SERVER_ERROR"
        };
    }
};

module.exports = {
    loginUser,
    setUsersStorage
};