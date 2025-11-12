const bcrypt = require('bcrypt');
const fs = require('fs');
const User = require('../models/User');

// Stockage en mémoire des utilisateurs (partagé avec AuthController)
let users = new Map();
let userIdCounter = 1;

// Fonction pour définir le stockage externe (appelée depuis AuthController)
const setUsersStorage = (usersMap, counter) => {
    users = usersMap;
    userIdCounter = counter;
};

// Fonction pour obtenir le compteur tuel
const getUserIdCounter = () => userIdCounter;

/**
 * Logique d'inscription utilisateur
 * @param {Object} userData - Les données de l'utilisateur {username, email, password}
 * @returns {Object} - Résultat de l'inscription
 */
const registerUser = async (userData) => {
    try {
        const { username, email, password } = userData;

        console.log("Tentative d'inscription pour:", email);

        // Validation des champs requis
        if (!username || !email || !password) {
            return {
                success: false,
                error: "Tous les champs sont requis.",
                code: "MISSING_FIELDS"
            };
        }

        // Validation du mot de passe
        const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{12,}/;
        if (!passwordRegex.test(password)) {
            return {
                success: false,
                error: "Le mot de passe doit contenir au moins 12 caractères, un chiffre, une lettre majuscule, une lettre minuscule et un caractère spécial.",
                code: "INVALID_PASSWORD"
            };
        }

        // Vérifier si l'utilisateur existe déjà
        let existingUser = null;
        for (const [id, user] of users.entries()) {
            if (user.email === email || user.username === username) {
                existingUser = user;
                break;
            }
        }

        if (existingUser) {
            const field = existingUser.email === email ? "email" : "nom d'utilisateur";
            return {
                success: false,
                error: `Un utilisateur avec ce ${field} existe déjà.`,
                code: "USER_EXISTS"
            };
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Créer le nouvel utilisateur avec UUID
        const userUUID = require('uuid').v4();
        const newUser = {
            UUID: userUUID,
            username,
            email,
            hashpassword: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            level: 1
        };

        // Sauvegarde utilisateur dans MongoDB avec Mongoose
        try {
            const userDoc = new User({
                UUID: userUUID,
                username: newUser.username,
                email: newUser.email,
                hashpassword: newUser.hashpassword,
                level: newUser.level
            });

            const savedUser = await userDoc.save();
            // Update profile 
            users.set(userUUID, {
                UUID: savedUser.UUID,
                username: savedUser.username,
                email: savedUser.email,
                hashpassword: savedUser.hashpassword,
                createdAt: savedUser.createdAt,
                updatedAt: savedUser.updatedAt,
                level: savedUser.level
            });

            console.log("Inscription réussie pour:", username);

            return {
                success: true,
                message: "Inscription réussie. Vous pouvez maintenant vous connecter.",
                user: {
                    UUID: savedUser.UUID,
                    username: savedUser.username,
                    email: savedUser.email,
                    level: savedUser.level
                }
            };
        } catch (error) {
            console.error("Erreur lors de la sauvegarde en base:", error);
            if (error.name === 'MongoServerError' && error.code === 11000) {
                return {
                    success: false,
                    error: "Un utilisateur avec cet email existe déjà.",
                    code: "USER_EXISTS"
                };
            }
            return {
                success: false,
                error: "Erreur serveur lors de l'inscription.",
                code: "SERVER_ERROR"
            };
        }

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        return {
            success: false,
            error: "Erreur serveur lors de l'inscription.",
            code: "SERVER_ERROR"
        };
    }
};

module.exports = {
    registerUser,
    setUsersStorage,
    getUserIdCounter
};
