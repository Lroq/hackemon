const fs = require('fs');
const path = require('path');

/**
 * Utilitaires pour gérer les tokens utilisateurs dans le fichier JSON
 */

const DB_FILE_PATH = path.join(__dirname, '../../test.json');

/**
 * Lit les données utilisateurs depuis le fichier JSON
 * @returns {Array} - Liste des utilisateurs
 */
const readUsersFromFile = () => {
    try {
        if (fs.existsSync(DB_FILE_PATH)) {
            const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf8');
            return JSON.parse(fileContent);
        }
        return [];
    } catch (error) {
        console.error("Erreur lors de la lecture du fichier utilisateurs:", error);
        return [];
    }
};

/**
 * Écrit les données utilisateurs dans le fichier JSON
 * @param {Array} users - Liste des utilisateurs à sauvegarder
 * @returns {boolean} - Succès de l'opération
 */
const writeUsersToFile = (users) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(users, null, 2));
        console.log(`Données utilisateurs sauvegardées dans ${DB_FILE_PATH}`);
        return true;
    } catch (error) {
        console.error("Erreur lors de l'écriture du fichier utilisateurs:", error);
        return false;
    }
};

/**
 * Trouve un utilisateur par UUID
 * @param {string} userUUID - UUID de l'utilisateur
 * @returns {Object|null} - Utilisateur trouvé ou null
 */
const findUserByUUID = (userUUID) => {
    const users = readUsersFromFile();
    return users.find(user => user.UUID === userUUID) || null;
};

/**
 * Trouve un utilisateur par email
 * @param {string} email - Email de l'utilisateur
 * @returns {Object|null} - Utilisateur trouvé ou null
 */
const findUserByEmail = (email) => {
    const users = readUsersFromFile();
    return users.find(user => user.email === email) || null;
};

/**
 * Met à jour un utilisateur dans le fichier
 * @param {string} userUUID - UUID de l'utilisateur
 * @param {Object} updateData - Données à mettre à jour
 * @returns {boolean} - Succès de l'opération
 */
const updateUserInFile = (userUUID, updateData) => {
    try {
        const users = readUsersFromFile();
        const userIndex = users.findIndex(user => user.UUID === userUUID);
        
        if (userIndex === -1) {
            console.error(`Utilisateur avec UUID ${userUUID} non trouvé`);
            return false;
        }

        // Mettre à jour les données
        users[userIndex] = {
            ...users[userIndex],
            ...updateData,
            updatedAt: new Date()
        };

        return writeUsersToFile(users);
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        return false;
    }
};

/**
 * Ajoute un refresh token à un utilisateur
 * @param {string} userUUID - UUID de l'utilisateur
 * @param {string} refreshToken - Token à ajouter
 * @returns {boolean} - Succès de l'opération
 */
const addRefreshToken = (userUUID, refreshToken) => {
    try {
        const users = readUsersFromFile();
        const userIndex = users.findIndex(user => user.UUID === userUUID);
        
        if (userIndex === -1) {
            console.error(`Utilisateur avec UUID ${userUUID} non trouvé`);
            return false;
        }

        // Initialiser le tableau de tokens s'il n'existe pas
        if (!users[userIndex].tokens) {
            users[userIndex].tokens = [];
        }

        // Ajouter le nouveau token
        users[userIndex].tokens.push(refreshToken);
        users[userIndex].updatedAt = new Date();

        return writeUsersToFile(users);
    } catch (error) {
        console.error("Erreur lors de l'ajout du refresh token:", error);
        return false;
    }
};

/**
 * Supprime un refresh token d'un utilisateur
 * @param {string} userUUID - UUID de l'utilisateur
 * @param {string} refreshToken - Token à supprimer
 * @returns {boolean} - Succès de l'opération
 */
const removeRefreshToken = (userUUID, refreshToken) => {
    try {
        const users = readUsersFromFile();
        const userIndex = users.findIndex(user => user.UUID === userUUID);
        
        if (userIndex === -1) {
            console.error(`Utilisateur avec UUID ${userUUID} non trouvé`);
            return false;
        }

        // Supprimer le token du tableau
        if (users[userIndex].tokens) {
            users[userIndex].tokens = users[userIndex].tokens.filter(
                token => token !== refreshToken
            );
            users[userIndex].updatedAt = new Date();
        }

        return writeUsersToFile(users);
    } catch (error) {
        console.error("Erreur lors de la suppression du refresh token:", error);
        return false;
    }
};

/**
 * Supprime tous les refresh tokens d'un utilisateur (déconnexion globale)
 * @param {string} userUUID - UUID de l'utilisateur
 * @returns {boolean} - Succès de l'opération
 */
const clearAllRefreshTokens = (userUUID) => {
    try {
        const users = readUsersFromFile();
        const userIndex = users.findIndex(user => user.UUID === userUUID);
        
        if (userIndex === -1) {
            console.error(`Utilisateur avec UUID ${userUUID} non trouvé`);
            return false;
        }

        // Vider le tableau de tokens
        users[userIndex].tokens = [];
        users[userIndex].updatedAt = new Date();

        return writeUsersToFile(users);
    } catch (error) {
        console.error("Erreur lors de la suppression des refresh tokens:", error);
        return false;
    }
};

/**
 * Vérifie si un refresh token est valide pour un utilisateur
 * @param {string} userUUID - UUID de l'utilisateur
 * @param {string} refreshToken - Token à vérifier
 * @returns {boolean} - Validité du token
 */
const isRefreshTokenValid = (userUUID, refreshToken) => {
    try {
        const user = findUserByUUID(userUUID);
        
        if (!user || !user.tokens) {
            return false;
        }

        return user.tokens.includes(refreshToken);
    } catch (error) {
        console.error("Erreur lors de la vérification du refresh token:", error);
        return false;
    }
};

/**
 * Nettoie les tokens expirés (optionnel, nécessite décodage JWT)
 * @param {string} userUUID - UUID de l'utilisateur
 * @returns {boolean} - Succès de l'opération
 */
const cleanupExpiredTokens = (userUUID) => {
    // Cette fonction pourrait décoder les JWT et supprimer ceux qui sont expirés
    // Pour l'instant, on laisse cette logique côté application
    console.log(`Nettoyage des tokens expirés pour l'utilisateur ${userUUID}`);
    return true;
};

module.exports = {
    readUsersFromFile,
    writeUsersToFile,
    findUserByUUID,
    findUserByEmail,
    updateUserInFile,
    addRefreshToken,
    removeRefreshToken,
    clearAllRefreshTokens,
    isRefreshTokenValid,
    cleanupExpiredTokens,
    DB_FILE_PATH
};
