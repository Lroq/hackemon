/**
 * Gestionnaire principal de l'application HackOS
 */
class AppManager {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
  }

  /**
   * Initialise l'application
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('AppManager already initialized');
      return;
    }

    console.log('Initializing HackOS...');

    this.setupEventListeners();
    this.setupDragAndDrop();
    this.checkUserSession();

    this.isInitialized = true;
    console.log('HackOS initialized successfully');
  }

  /**
   * Configure les écouteurs d'événements principaux
   * @private
   */
  setupEventListeners() {
    // Gestionnaire pour le bouton menu
    const menuButton = document.querySelector('#menubtn');
    if (menuButton) {
      EventUtils.onDoubleClick(menuButton, () => {
        this.openMenu();
      });
    }

    // Gestionnaire pour les raccourcis clavier
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Configure le drag and drop pour les applications
   * @private
   */
  setupDragAndDrop() {
    const apps = document.querySelectorAll('.apps .app:not(#bin)');
    if (apps.length > 0) {
      EventUtils.setupAppDragAndDrop(apps);
    }
  }

  /**
   * Vérifie si une session utilisateur existe
   * @private
   */
  async checkUserSession() {
    try {
      const user = await ApiService.getProfile();
      this.currentUser = user;
      console.log('User session found:', user);
    } catch (error) {
      console.log('No active user session');
      this.currentUser = null;
    }
  }

  /**
   * Ouvre le menu principal
   */
  openMenu() {
    const menu = new Menu();

    // Callback pour la connexion réussie
    menu.handleLoginSuccess = (user) => {
      this.currentUser = user;
      this.onUserLogin(user);
    };
  }

  /**
   * Gère les raccourcis clavier
   * @private
   * @param {KeyboardEvent} e - Événement clavier
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + M pour ouvrir le menu
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      this.openMenu();
    }

    // Escape pour fermer toutes les fenêtres (optionnel)
    if (e.key === 'Escape' && e.shiftKey) {
      this.closeAllWindows();
    }
  }

  /**
   * Ferme toutes les fenêtres ouvertes
   */
  closeAllWindows() {
    const windows = document.querySelectorAll('.window.closeable');
    windows.forEach((window) => {
      const closeButton = window.querySelector('.app-close');
      if (closeButton) {
        closeButton.click();
      }
    });
  }

  /**
   * Actions à effectuer lors de la connexion d'un utilisateur
   * @param {Object} user - Données utilisateur
   */
  onUserLogin(user) {
    console.log(`Welcome ${user.username}!`);

    // Ici vous pouvez ajouter des actions spécifiques post-connexion
    // Par exemple : charger des données utilisateur, initialiser des modules, etc.

    this.loadUserApplications(user);
  }

  /**
   * Charge les applications spécifiques à l'utilisateur
   * @param {Object} user - Données utilisateur
   * @private
   */
  loadUserApplications(user) {
    // Exemple : ajouter des applications dynamiquement selon les droits utilisateur
    console.log('Loading user applications for:', user.username);

    // Ici vous pourriez ajouter la logique pour :
    // - Charger des applications spécifiques
    // - Configurer l'interface selon les permissions
    // - Initialiser des modules utilisateur
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    this.currentUser = null;
    this.closeAllWindows();

    // Ici vous pourriez ajouter :
    // - Un appel API de déconnexion
    // - Nettoyage des données locales
    // - Redirection ou réinitialisation de l'interface

    console.log('User logged out');
  }

  /**
   * Récupère l'utilisateur actuel
   * @returns {Object|null} Utilisateur actuel ou null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Vérifie si un utilisateur est connecté
   * @returns {boolean} True si connecté
   */
  isUserLoggedIn() {
    return this.currentUser !== null;
  }
}

// Instance globale du gestionnaire d'application
window.AppManager = new AppManager();
