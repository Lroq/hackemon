const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // Importe le modèle User

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const router = express.Router();

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
            return res.status(400).json({ error: "Email or password is incorrect." });
        }

        // Verify the password
        const match = await bcrypt.compare(password, user.hashpassword);
        if (!match) {
            return res.status(400).json({ error: "Email or password is incorrect." });
        }

        const tokenPayload = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({ success: true, token, user: tokenPayload });
    } catch (err) {
        console.error("Error processing request:", err.message);
        res.status(500).json({ error: "Error processing request." });
    }
};

module.exports = {
    loginUser,
    setUsersStorage
};