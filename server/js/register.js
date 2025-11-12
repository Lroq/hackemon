const bcrypt = require('bcrypt');
const fs = require('fs');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { 
    readUsersFromFile, 
    writeUsersToFile, 
    findUserByEmail, 
    addRefreshToken 
} = require('../utils/userTokenManager');

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

        // Vérifier si l'utilisateur existe déjà dans le fichier JSON
        const existingData = readUsersFromFile();
        const existingUserByEmail = findUserByEmail(email);
        const existingUserByUsername = existingData.find(user => user.username === username);

        if (existingUserByEmail || existingUserByUsername) {
            const field = existingUserByEmail ? "email" : "nom d'utilisateur";
            return {
                success: false,
                error: `Un utilisateur avec ce ${field} existe déjà.`,
                code: "USER_EXISTS"
            };
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Générer les tokens JWT d'abord
        const userUUID = require('uuid').v4();
        const accessToken = generateAccessToken({
            UUID: userUUID,
            username,
            email,
            level: 1
        });

        const refreshToken = generateRefreshToken({
            UUID: userUUID,
            username
        });

        // Créer le nouvel utilisateur avec UUID et tokens
        const newUser = {
            UUID: userUUID,
            username,
            email,
            hashpassword: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            tokens: [refreshToken], // Stockage du refresh token dans la DB
            level: 1
        };

        // Sauvegarder dans le fichier JSON
        const currentUsers = readUsersFromFile();
        currentUsers.push(newUser);

        // Écrire les données dans le fichier
        const saveSuccess = writeUsersToFile(currentUsers);
        if (!saveSuccess) {
            return {
                success: false,
                error: "Erreur lors de la sauvegarde de l'utilisateur.",
                code: "SAVE_ERROR"
            };
        }

        users.set(userUUID, newUser);

        console.log("Inscription réussie pour:", username);

        return {
            success: true,
            message: "Inscription réussie. Vous pouvez maintenant vous connecter.",
            user: {
                UUID: userUUID,
                username: newUser.username,
                email: newUser.email,
                level: newUser.level
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };

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
