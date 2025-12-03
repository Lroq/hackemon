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
const DatabaseConfig = require('./config/database');

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
                console.error('Erreur initialisation MongoDB:', err && err.message ? err.message : err);
                // On continue pour permettre d'utiliser le serveur en mode dégradé si nécessaire
        }
})();

// Middleware parse requêtes JSON
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
            console.log('Initialisation du serveur HackOS...');
            
            // Configuration des middlewares
            this.setupMiddlewares();
            
            // Configuration des routes
            this.setupRoutes();
            
            // Gestion des erreurs
            this.setupErrorHandling();
            
            this.start();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
            process.exit(1);
        }
    }

    /**
     * Configure les middlewares
     * @private
     */
    setupMiddlewares() {
        // Trust proxy pour les déploiements derrière un reverse proxy
        this.app.set('trust proxy', 1);

        // Middleware pour parser les requêtes JSON
        this.app.use(express.json({ limit: '10mb' }));

        // Middleware pour parser les requêtes URL-encoded
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Middleware pour les fichiers statiques
        this.app.use(express.static(path.join(__dirname, '../')));
        this.app.use("/public", express.static(path.join(__dirname, "../public")));
// Middleware statiques
app.use(express.static(path.join(__dirname, "../")));

app.use("/public", express.static("../public"));

app.use(
  session({
    secret: "hackemon_lesmeilleurs8",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true pour HTTPS
  })
);

const routes = require("./routes");
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
        // Configuration des sessions en mémoire (sans stockage persistant)
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'hackemon_lesmeilleurs8_super_secret_key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false, // HTTP seulement pour développement
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 // 24 heures
            }
        }));

        // Headers de sécurité basiques
        this.app.use((req, res, next) => {
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
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
            const routes = require('./routes');
            this.app.use('/', routes);
        } catch (error) {
            console.error('Erreur lors du chargement des routes:', error.message);
            // Routes de base sans dépendances
            this.setupBasicRoutes();
        }

        // Route 404
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint non trouvé',
                code: 'NOT_FOUND',
                path: req.originalUrl
            });
        });
    }

    /**
     * Configure les routes de base sans dépendances
     * @private
     */
    setupBasicRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/templates/index.html'));
        });

        // Route de santé
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Routes d'authentification simplifiées (sans base de données)
        this.app.post('/login', (req, res) => {
            const { username, password } = req.body;
            
            // Authentification simplifiée pour test
            if (username && password) {
                req.session.user = { username, id: Date.now() };
                res.json({ 
                    success: true, 
                    message: 'Connexion réussie',
                    user: { username }
                });
            } else {
                res.status(401).json({ 
                    success: false, 
                    message: 'Identifiants requis' 
                });
            }
        });

        this.app.post('/register', (req, res) => {
            const { username, password, email } = req.body;
            
            // Enregistrement simplifié pour test
            if (username && password) {
                res.json({ 
                    success: true, 
                    message: 'Compte créé avec succès',
                    user: { username, email }
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: 'Nom d\'utilisateur et mot de passe requis' 
                });
            }
        });

        this.app.post('/logout', (req, res) => {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erreur lors de la déconnexion' 
                    });
                }
                res.json({ 
                    success: true, 
                    message: 'Déconnexion réussie' 
                });
            });
        });

        this.app.get('/session', (req, res) => {
            if (req.session.user) {
                res.json({ 
                    authenticated: true, 
                    user: req.session.user 
                });
            } else {
                res.json({ 
                    authenticated: false 
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
            console.error('❌ Erreur serveur:', error);

            // Ne pas exposer les détails d'erreur en production
            const isDevelopment = process.env.NODE_ENV !== 'production';
            
            res.status(error.status || 500).json({
                error: isDevelopment ? error.message : 'Erreur serveur interne',
                code: 'SERVER_ERROR',
                ...(isDevelopment && { stack: error.stack })
            });
        });

        // Gestion des promesses rejetées non catchées
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Promesse rejetée non gérée:', reason);
            // En production, vous pourriez vouloir redémarrer le serveur
        });

        // Gestion des exceptions non catchées
        process.on('uncaughtException', (error) => {
            console.error('❌ Exception non gérée:', error);
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

        process.on('SIGINT', () => {
            console.log('\n🛑 Arrêt du serveur...');
            server.close(() => {
                console.log('✅ Serveur arrêté proprement');
                process.exit(0);
            });
        });
        process.stdin.resume();
    }
}

const server = new Server();
server.initialize();

module.exports = server;
