const { verifyToken, generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { 
    findUserByUUID, 
    addRefreshToken, 
    removeRefreshToken, 
    isRefreshTokenValid 
} = require('../utils/userTokenManager');

/**
 * Renouvelle un token d'accès à partir d'un refresh token
 * @param {Object} tokenData - {refreshToken}
 * @returns {Object} - Nouveau token d'accès ou erreur
 */
const refreshAccessToken = async (tokenData) => {
    try {
        const { refreshToken } = tokenData;

        if (!refreshToken) {
            return {
                success: false,
                error: "Refresh token requis",
                code: "MISSING_REFRESH_TOKEN"
            };
        }

        // Vérifier le refresh token
        const decoded = verifyToken(refreshToken);
        
        if (!decoded) {
            return {
                success: false,
                error: "Refresh token invalide ou expiré",
                code: "INVALID_REFRESH_TOKEN"
            };
        }

        // Chercher l'utilisateur dans le fichier JSON
        const user = findUserByUUID(decoded.UUID);

        if (!user) {
            return {
                success: false,
                error: "Utilisateur non trouvé",
                code: "USER_NOT_FOUND"
            };
        }

        // Vérifier que le refresh token est dans la liste des tokens valides
        if (!isRefreshTokenValid(user.UUID, refreshToken)) {
            return {
                success: false,
                error: "Refresh token non autorisé",
                code: "UNAUTHORIZED_REFRESH_TOKEN"
            };
        }

        // Générer un nouveau token d'accès
        const newAccessToken = generateAccessToken({
            UUID: user.UUID,
            username: user.username,
            email: user.email,
            level: user.level
        });

        // Générer un nouveau refresh token (rotation des tokens)
        const newRefreshToken = generateRefreshToken({
            UUID: user.UUID,
            username: user.username
        });

        // Remplacer l'ancien refresh token par le nouveau dans le fichier
        const tokenRemoved = removeRefreshToken(user.UUID, refreshToken);
        const tokenAdded = addRefreshToken(user.UUID, newRefreshToken);

        if (!tokenRemoved || !tokenAdded) {
            console.warn("Problème lors de la rotation des tokens dans le fichier");
        }

        return {
            success: true,
            message: "Token renouvelé avec succès",
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        };

    } catch (error) {
        console.error("Erreur lors du renouvellement du token:", error);
        return {
            success: false,
            error: "Erreur serveur lors du renouvellement du token",
            code: "SERVER_ERROR"
        };
    }
};

/**
 * Révoque un refresh token (déconnexion)
 * @param {Object} tokenData - {refreshToken}
 * @returns {Object} - Résultat de la révocation
 */
const revokeRefreshToken = async (tokenData) => {
    try {
        const { refreshToken } = tokenData;

        if (!refreshToken) {
            return {
                success: false,
                error: "Refresh token requis",
                code: "MISSING_REFRESH_TOKEN"
            };
        }

        const decoded = verifyToken(refreshToken);
        
        if (!decoded) {
            return {
                success: true,
                message: "Token déjà invalide"
            };
        }

        // Supprimer le token du fichier
        const tokenRemoved = removeRefreshToken(decoded.UUID, refreshToken);
        
        if (!tokenRemoved) {
            console.warn("Impossible de supprimer le refresh token du fichier");
        }

        return {
            success: true,
            message: "Token révoqué avec succès"
        };

    } catch (error) {
        console.error("Erreur lors de la révocation du token:", error);
        return {
            success: false,
            error: "Erreur serveur lors de la révocation du token",
            code: "SERVER_ERROR"
        };
    }
};

module.exports = {
    refreshAccessToken,
    revokeRefreshToken
};