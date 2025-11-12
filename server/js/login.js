const bcrypt = require('bcrypt');
const User = require('../models/User');

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
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, userDoc.hashpassword);
        if (!isPasswordValid) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        // update en mémoire 
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

        return {
            success: true,
            message: "Connexion réussie.",
            user: {
                id: userDoc.UUID,
                username: userDoc.username,
                email: userDoc.email,
                level: userDoc.level
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