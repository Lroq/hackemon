const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");

const readEnvFile = require("./readfile");
const envVariables = readEnvFile();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "hackemon_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const fallbackUsers = new Map();
let fallbackUserIdCounter = 1;

console.log(envVariables);
// Initialisation de la connexion MongoDB via le module de config
const DatabaseConfig = require("./config/database");

(async () => {
  try {
    // Preference to explicit MONGO_URI (from .env or environment) else fallback to localhost
    if (envVariables.MONGO_URI) {
      await DatabaseConfig.connect(envVariables.MONGO_URI);
    } else {
      // Tentative de connexion locale (utile avec docker-compose local)
      await DatabaseConfig.connect();
    }
  } catch (err) {
    console.error(
      "Erreur initialisation MongoDB:",
      err && err.message ? err.message : err
    );
    // On continue pour permettre d'utiliser le serveur en mode dégradé si nécessaire
  }
})();

// Middleware parse JSON
app.use(express.json());

class Server {
  constructor() {
    this.app = app;
    this.port = PORT;
  }

  /**
   * Initialise le serveur
   */
  async initialize() {
    try {
      console.log("Initialisation du serveur HackOS...");

      // Configuration des middlewares
      this.setupMiddlewares();

      // Configuration des routes
      this.setupRoutes();

      // Gestion des erreurs
      this.setupErrorHandling();

      this.start();
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du serveur:", error);
      process.exit(1);
    }
  }

  /**
   * Configure les middlewares
   * @private
   */
  setupMiddlewares() {
    // Trust proxy pour les déploiements derrière un reverse proxy
    this.app.set("trust proxy", 1);

    // Middleware pour parser les requêtes JSON
    this.app.use(express.json({ limit: "10mb" }));

    // Middleware pour parser les requêtes URL-encoded
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Middleware pour les fichiers statiques
    this.app.use(express.static(path.join(__dirname, "../")));
    this.app.use("/public", express.static(path.join(__dirname, "../public")));
    // Middleware statiques
    app.use(express.static(path.join(__dirname, "../")));

    app.use("/public", express.static("../public"));

    // Headers de sécurité basiques
    this.app.use((req, res, next) => {
      res.header("X-Content-Type-Options", "nosniff");
      res.header("X-Frame-Options", "DENY");
      res.header("X-XSS-Protection", "1; mode=block");
      next();
    });

    // // Logging des requêtes
    // this.app.use((req, res, next) => {
    //     const timestamp = new Date().toISOString();
    //     console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    //     next();
    // });
  }

  /**
   * Configure les routes
   * @private
   */
  setupRoutes() {
    try {
      const routes = require("./routes");
      this.app.use("/", routes);
    } catch (error) {
      console.error("Erreur lors du chargement des routes:", error.message);
      // Routes de base sans dépendances
      this.setupBasicRoutes();
    }

    // Route 404
    this.app.use((req, res) => {
      res.status(404).json({
        error: "Endpoint non trouvé",
        code: "NOT_FOUND",
        path: req.originalUrl,
      });
    });
  }

  /**
   * Configure les routes de base sans dépendances
   * @private
   */
  setupBasicRoutes() {
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../public/templates/index.html"));
    });

    // Route de santé
    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Routes d'authentification simplifiées (sans base de données)
    const createToken = (userPayload) =>
      jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const extractToken = (req) => {
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
      }
      return null;
    };

    this.app.post("/login", (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(401).json({
          success: false,
          message: "Identifiants requis",
        });
      }

      let existingUser = null;
      for (const user of fallbackUsers.values()) {
        if (user.email === email && user.password === password) {
          existingUser = user;
          break;
        }
      }

      if (!existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      const tokenPayload = {
        userId: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      };

      res.json({
        success: true,
        message: "Connexion réussie",
        token: createToken(tokenPayload),
        user: tokenPayload,
      });
    });

    this.app.post("/register", (req, res) => {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          message: "Nom d'utilisateur, email et mot de passe requis",
        });
      }

      const alreadyExists = Array.from(fallbackUsers.values()).some(
        (user) => user.email === email || user.username === username
      );

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: "Un utilisateur avec cet email ou nom existe déjà",
        });
      }

      const newUser = {
        id: fallbackUserIdCounter++,
        username,
        email,
        password,
      };

      fallbackUsers.set(newUser.id, newUser);

      const tokenPayload = {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      };

      res.status(201).json({
        success: true,
        message: "Compte créé avec succès",
        token: createToken(tokenPayload),
        user: tokenPayload,
      });
    });

    this.app.post("/logout", (req, res) => {
      res.json({
        success: true,
        message: "Déconnexion réussie. Supprimez votre token côté client.",
      });
    });

    this.app.get("/session", (req, res) => {
      const token = extractToken(req);
      if (!token) {
        return res.json({
          authenticated: false,
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
          authenticated: true,
          user: decoded,
        });
      } catch (error) {
        res.status(401).json({
          authenticated: false,
          error: "Token invalide ou expiré",
        });
      }
    });
  }

  /**
   * Configure la gestion des erreurs
   * @private
   */
  setupErrorHandling() {
    // Gestionnaire d'erreur global
    this.app.use((error, req, res, next) => {
      console.error("❌ Erreur serveur:", error);

      // Ne pas exposer les détails d'erreur en production
      const isDevelopment = process.env.NODE_ENV !== "production";

      res.status(error.status || 500).json({
        error: isDevelopment ? error.message : "Erreur serveur interne",
        code: "SERVER_ERROR",
        ...(isDevelopment && { stack: error.stack }),
      });
    });

    // Gestion des promesses rejetées non catchées
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Promesse rejetée non gérée:", reason);
      // En production, vous pourriez vouloir redémarrer le serveur
    });

    // Gestion des exceptions non catchées
    process.on("uncaughtException", (error) => {
      console.error("❌ Exception non gérée:", error);
      process.exit(1);
    });
  }

  /**
   * Démarre le serveur
   * @private
   */
  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`Application disponible sur: http://localhost:${this.port}`);
    });

    process.on("SIGINT", () => {
      console.log("\n🛑 Arrêt du serveur...");
      server.close(() => {
        console.log("✅ Serveur arrêté proprement");
        process.exit(0);
      });
    });
    process.stdin.resume();
  }
}

const server = new Server();
server.initialize();

module.exports = server;
