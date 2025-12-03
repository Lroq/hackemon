# HackOS - Architecture Refactorisée

## 📁 Structure du Projet

### Côté Client (`/public/templates/js/`)

```
js/
├── app.js                    # Point d'entrée principal
├── main.js                   # ANCIEN fichier (peut être supprimé)
├── utils/                    # Utilitaires réutilisables
│   ├── HTMLBuilder.js        # Construction d'éléments HTML
│   ├── EventUtils.js         # Gestion des événements
│   └── ApiService.js         # Communication avec l'API
├── components/               # Composants d'interface
│   ├── Window.js             # Classe de base des fenêtres
│   ├── Menu.js               # Menu principal
│   ├── Login.js              # Fenêtre de connexion
│   ├── Register.js           # Fenêtre d'inscription
│   └── LoadingBar.js         # Barre de progression
└── modules/                  # Modules principaux
    └── AppManager.js         # Gestionnaire principal de l'app
```

### Côté Serveur (`/server/`)

```
server/
├── server.js                 # Serveur principal (refactorisé)
├── routes.js                 # Routes principales (refactorisé)
├── config/                   # Configuration
│   └── database.js           # Configuration MongoDB
├── controllers/              # Contrôleurs
│   └── AuthController.js     # Contrôleur d'authentification
├── middleware/               # Middlewares
│   ├── auth.js               # Middleware d'authentification
│   └── validation.js         # Middleware de validation
├── models/                   # Modèles existants
│   └── User.js               # Modèle utilisateur
└── js/                       # ANCIENS fichiers (peuvent être supprimés)
    ├── login.js
    └── register.js
```

## � Installation des Dépendances

### Dépendances Essentielles

Pour installer toutes les dépendances nécessaires au projet, exécutez la commande suivante :

```bash
npm install axios bcrypt connect-mongo dotenv express express-session fs jsonwebtoken mongoose node uuid
```

**Description des dépendances principales :**
- `express` : Framework web pour Node.js
- `mongoose` : ODM pour MongoDB
- `bcrypt` : Chiffrement des mots de passe
- `jsonwebtoken` : Gestion des tokens JWT
- `express-session` : Gestion des sessions
- `connect-mongo` : Stockage des sessions MongoDB
- `axios` : Client HTTP pour les requêtes API
- `dotenv` : Gestion des variables d'environnement
- `uuid` : Génération d'identifiants uniques

## �🚀 Améliorations Apportées

### Côté Client

1. **Modularité** : Code séparé en modules spécialisés
2. **HTMLBuilder** : Utilitaire centralisé pour créer des éléments HTML
3. **EventUtils** : Gestion centralisée des événements (double-clic, drag & drop)
4. **ApiService** : Communication unifiée avec le serveur
5. **AppManager** : Gestionnaire principal avec gestion de session
6. **Composants réutilisables** : Window, Menu, Login, Register, LoadingBar
7. **Chargement dynamique** : Les modules se chargent automatiquement
8. **Gestion d'erreurs** : Écrans de chargement et d'erreur

### Côté Serveur

1. **Architecture MVC** : Séparation Controllers/Middlewares/Routes
2. **DatabaseConfig** : Configuration centralisée de MongoDB
3. **Middlewares** : Authentification, validation, logging
4. **AuthController** : Logique d'authentification centralisée
5. **Validation** : Validation robuste des données
6. **Gestion d'erreurs** : Gestion centralisée des erreurs
7. **Sessions sécurisées** : Stockage des sessions en MongoDB
8. **Sécurité** : Headers de sécurité, validation, sanitisation

## 🔧 Installation et Démarrage

### Prérequis
- Node.js (version 16 ou supérieure)
- MongoDB
- Fichier `.env` avec les credentials MongoDB

### Installation complète
```bash
# Installation de toutes les dépendances
npm install axios bcrypt connect-mongo dotenv express express-session fs jsonwebtoken mongoose node uuid
```

### Démarrage
```bash
# Depuis le répertoire racine du projet
cd server/
node server.js
```

## 📋 Fonctionnalités

### Nouvelles Fonctionnalités

1. **Écran de chargement** : Affichage du chargement des modules
2. **Gestion d'erreurs** : Écrans d'erreur informatifs
3. **Raccourcis clavier** : Ctrl/Cmd + M pour ouvrir le menu
4. **Sessions persistantes** : Les sessions survivent aux redémarrages
5. **API santé** : Endpoint `/health` pour vérifier l'état du serveur
6. **Logging** : Logging des requêtes et erreurs
7. **Validation renforcée** : Validation côté client et serveur

### Fonctionnalités Préservées

- ✅ Système de fenêtres draggables
- ✅ Menu principal avec authentification
- ✅ Connexion/Inscription
- ✅ Drag & drop des applications
- ✅ Design rétro préservé

## 🛠️ API Endpoints

### Authentification
- `POST /login` - Connexion utilisateur
- `POST /register` - Inscription utilisateur
- `POST /logout` - Déconnexion utilisateur
- `GET /profile` - Profil utilisateur (protégée)
- `GET /session` - État de la session

### Utilitaires
- `GET /health` - État du serveur
- `GET /` - Page principale

## 🔒 Sécurité

### Améliorations de Sécurité

1. **Headers de sécurité** : X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
2. **Sessions sécurisées** : HttpOnly, Secure en production
3. **Validation stricte** : Validation des données côté client et serveur
4. **Sanitisation** : Nettoyage des données d'entrée
5. **Gestion d'erreurs** : Pas d'exposition des détails en production
6. **Rate limiting** : Prêt pour l'ajout de rate limiting

## 🧪 Développement

### Ajout de Nouveaux Modules

1. Créer le fichier dans le dossier approprié (`utils/`, `components/`, `modules/`)
2. L'ajouter à la liste dans `app.js`
3. Utiliser les patterns existants (classes, exports globaux)

### Debugging

- Ouvrir la console développeur
- Vérifier `window.HackOS` pour les informations de debug
- Logs détaillés disponibles en mode développement

## 📝 Migration

### Pour supprimer l'ancien code :

1. Supprimer `/public/templates/js/main.js`
2. Supprimer `/server/js/login.js`
3. Supprimer `/server/js/register.js`

### Code de migration des sessions existantes :
Les sessions existantes resteront valides grâce à la nouvelle configuration MongoDB.

## 🎯 Prochaines Étapes Suggérées

1. **Tests unitaires** : Ajouter des tests pour les composants
2. **TypeScript** : Migration vers TypeScript pour une meilleure maintenabilité
3. **Build process** : Ajout de Webpack ou Vite pour la bundling
4. **PWA** : Transformer en Progressive Web App
5. **Monitoring** : Ajout de monitoring et métriques
6. **Documentation API** : Swagger/OpenAPI documentation
