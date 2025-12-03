const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");

const readEnvFile = require("./readfile");
const envVariables = readEnvFile();

const app = express();
const PORT = process.env.PORT || 3000;

console.log(envVariables);

// Initialisation de la connexion MongoDB via le module de config
const DatabaseConfig = require("./config/database");

(async () => {
  try {
    if (envVariables.MONGO_URI) {
      await DatabaseConfig.connect(envVariables.MONGO_URI);
    } else {
      await DatabaseConfig.connect();
    }
  } catch (err) {
    console.error(
      "Erreur initialisation MongoDB:",
      err && err.message ? err.message : err
    );
  }
})();

// Middleware parse JSON
app.use(express.json());

class Server {
  constructor() {
    this.app = app;
    this.port = PORT;
  }

  async initialize() {
    try {
      console.log("Initialisation du serveur HackOS...");

      this.setupMiddlewares();
      this.setupRoutes();
      this.setupErrorHandling();
      this.start();
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du serveur:", error);
      process.exit(1);
    }
  }

  setupMiddlewares() {
    this.app.set("trust proxy", 1);

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Fichiers statiques
    this.app.use(express.static(path.join(__dirname, "../")));
    this.app.use("/public", express.static(path.join(__dirname, "../public")));

    // Sessions (version correcte et cohérente)
    this.app.use(
      session({
        secret:
          process.env.SESSION_SECRET ||
          "hackemon_lesmeilleurs8_super_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false,
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24,
        },
      })
    );

    // Headers de sécurité
    this.app.use((req, res, next) => {
      res.header("X-Content-Type-Options", "nosniff");
      res.header("X-Frame-Options", "DENY");
      res.header("X-XSS-Protection", "1; mode=block");
      next();
    });
  }

  setupRoutes() {
    try {
      const routes = require("./routes");
      this.app.use("/", routes);
    } catch (error) {
      console.error("Erreur lors du chargement des routes:", error.message);
      this.setupBasicRoutes();
    }

    // 404
    this.app.use((req, res) => {
      res.status(404).json({
        error: "Endpoint non trouvé",
        code: "NOT_FOUND",
        path: req.originalUrl,
      });
    });
  }

  setupBasicRoutes() {
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../public/templates/index.html"));
    });

    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.app.post("/login", (req, res) => {
      const { username, password } = req.body;

      if (username && password) {
        req.session.user = { username, id: Date.now() };
        res.json({
          success: true,
          message: "Connexion réussie",
          user: { username },
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Identifiants requis",
        });
      }
    });

    this.app.post("/register", (req, res) => {
      const { username, password, email } = req.body;

      if (username && password) {
        res.json({
          success: true,
          message: "Compte créé avec succès",
          user: { username, email },
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Nom d'utilisateur et mot de passe requis",
        });
      }
    });

    this.app.post("/logout", (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la déconnexion",
          });
        }
        res.json({
          success: true,
          message: "Déconnexion réussie",
        });
      });
    });

    this.app.get("/session", (req, res) => {
      if (req.session.user) {
        res.json({
          authenticated: true,
          user: req.session.user,
        });
      } else {
        res.json({
          authenticated: false,
        });
      }
    });
  }

  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error("❌ Erreur serveur:", error);

      const isDevelopment = process.env.NODE_ENV !== "production";

      res.status(error.status || 500).json({
        error: isDevelopment ? error.message : "Erreur serveur interne",
        code: "SERVER_ERROR",
        ...(isDevelopment && { stack: error.stack }),
      });
    });

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Promesse rejetée non gérée:", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("❌ Exception non gérée:", error);
      process.exit(1);
    });
  }

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
