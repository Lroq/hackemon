const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Importe le modèle User

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

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
        let user = null;
        try {
            const userDoc = await User.findOne({ email }).lean();
            if (userDoc) {
                user = userDoc;
            }
        } catch (mongoError) {
            console.log("MongoDB non disponible, utilisation du stockage mémoire");
        }

        // Si pas trouvé dans MongoDB, chercher dans le stockage mémoire
        if (!user) {
            for (const [id, userData] of users.entries()) {
                if (userData.email === email) {
                    user = { ...userData, _id: id };
                    break;
                }
            }
        }

        if (!user) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        // Vérifier le mot de passe
        const match = await bcrypt.compare(password, user.hashpassword);
        if (!match) {
            return {
                success: false,
                error: "Email ou mot de passe incorrect.",
                code: "INVALID_CREDENTIALS"
            };
        }

        const tokenPayload = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return { 
            success: true, 
            token, 
            user: tokenPayload,
            message: "Connexion réussie."
        };
    } catch (err) {
        console.error("Error processing request:", err.message);
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