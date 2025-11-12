/**
 * Configuration de la base de données MongoDB
 */
const mongoose = require('mongoose');
const readEnvFile = require('../readfile');

class DatabaseConfig {
    constructor() {
        this.envVariables = readEnvFile();
        this.connection = null;
    }

    /**
     * Initialise la connexion à MongoDB
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            if (!this.envVariables.MONGO_INITDB_ROOT_USERNAME || !this.envVariables.MONGO_INITDB_ROOT_PASSWORD) {
                throw new Error('Impossible de lire les variables d\'environnement. Vérifiez le fichier .env.');
            }

            const { MONGO_INITDB_ROOT_USERNAME: username, MONGO_INITDB_ROOT_PASSWORD: password } = this.envVariables;
            const database = "hackemon";

            const mongoUri = `mongodb://${username}:${password}@localhost:27017/${database}?authSource=admin`;
            
            console.log('Connexion à MongoDB...');
            
            this.connection = await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            console.log('Connexion à MongoDB réussie.');
            
            // Écouter les événements de connexion
            this.setupConnectionEvents();
            
        } catch (error) {
            console.error('Erreur de connexion à MongoDB:', error.message);
            throw error;
        }
    }

    /**
     * Configure les événements de connexion MongoDB
     * @private
     */
    setupConnectionEvents() {
        mongoose.connection.on('error', (error) => {
            console.error('Erreur MongoDB:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB déconnecté');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnecté');
        });

        // Fermeture propre lors de l'arrêt de l'application
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    /**
     * Ferme la connexion à la base de données
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            await mongoose.connection.close();
            console.log('Connexion MongoDB fermée.');
        } catch (error) {
            console.error('Erreur lors de la fermeture de la connexion:', error);
        }
    }

    /**
     * Vérifie l'état de la connexion
     * @returns {boolean} True si connecté
     */
    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new DatabaseConfig();
