/**
 * Configuration de la base de données MongoDB
 */
const mongoose = require("mongoose");

class DatabaseConfig {
  constructor() {
    this.connection = null;
  }

  /**
   * Initialise la connexion à MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Priorité: URI explicite passée en argument -> MONGO_URI dans .env -> fallback local
      const database = "hackemon";

      // allow connect(uri) call
      const explicitUri =
        arguments && arguments.length > 0 ? arguments[0] : null;

      let mongoUri = explicitUri || null;

      if (!mongoUri) {
        // Try environment variable first (docker-compose passes MONGO_URI)
        if (process.env.MONGO_URI) {
          mongoUri = process.env.MONGO_URI;
        } else {
          // Fallbacks:
          // - In container: use service name 'mongo'
          // - Locally: 127.0.0.1
          const inContainer = process.env.NODE_ENV === "production" || process.env.RUNNING_IN_DOCKER === "true";
          mongoUri = inContainer
            ? `mongodb://mongo:27017/${database}`
            : `mongodb://127.0.0.1:27017/${database}`;
        }
      }

      console.log("Connexion à MongoDB via URI:", mongoUri);

      this.connection = await mongoose.connect(mongoUri);

      console.log("Connexion à MongoDB réussie.");

      // Écouter les événements de connexion
      this.setupConnectionEvents();
    } catch (error) {
      console.error("Erreur de connexion à MongoDB:", error.message);
      throw error;
    }
  }

  /**
   * Configure les événements de connexion MongoDB
   * @private
   */
  setupConnectionEvents() {
    mongoose.connection.on("error", (error) => {
      console.error("Erreur MongoDB:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB déconnecté");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnecté");
    });

    // Fermeture propre lors de l'arrêt de l'application
    process.on("SIGINT", async () => {
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
      console.log("Connexion MongoDB fermée.");
    } catch (error) {
      console.error("Erreur lors de la fermeture de la connexion:", error);
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