const bcrypt = require('bcrypt');
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

        // Chercher l'utilisateur dans le fichier JSON
        const user = findUserByEmail(email);

        if (!user) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.hashpassword);
        if (!isPasswordValid) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        console.log("Connexion réussie pour:", user.username);

        // Générer les tokens JWT
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