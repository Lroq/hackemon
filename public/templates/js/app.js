/**
 * Point d'entrée principal de l'application HackOS
 * Ce fichier remplace l'ancien main.js en chargeant tous les modules de manière organisée
 */

/**
 * Configuration de l'application
 */
const AppConfig = {
  modules: {
    utils: [
      '/public/templates/js/utils/HTMLBuilder.js',
      '/public/templates/js/utils/EventUtils.js',
      '/public/templates/js/utils/ApiService.js',
    ],
    components: [
      '/public/templates/js/components/Window.js',
      '/public/templates/js/components/Menu.js',
      '/public/templates/js/components/Corbeille.js',
      '/public/templates/js/components/Login.js',
      '/public/templates/js/components/Register.js',
      '/public/templates/js/components/LoadingBar.js',
    ],
    modules: ['/public/templates/js/modules/AppManager.js'],
  },

  // Configuration de l'application
  settings: {
    enableKeyboardShortcuts: true,
    enableDragAndDrop: true,
    enableLogging: false,
  },
};

/**
 * Chargeur de modules
 */
class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadPromises = new Map();
  }

  /**
   * Charge un script de manière asynchrone
   * @param {string} src - Chemin vers le script
   * @returns {Promise<void>}
   */
  async loadScript(src) {
    // Éviter le double chargement
    if (this.loadedModules.has(src)) {
      return Promise.resolve();
    }

    // Retourner la promesse existante si le chargement est en cours
    if (this.loadPromises.has(src)) {
      return this.loadPromises.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        this.loadedModules.add(src);
        console.log(`✅ Module chargé: ${src}`);
        resolve();
      };

      script.onerror = () => {
        console.error(`❌ Erreur lors du chargement: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadPromises.set(src, promise);
    return promise;
  }

  /**
   * Charge un groupe de scripts en parallèle
   * @param {Array<string>} scripts - Liste des scripts à charger
   * @returns {Promise<void>}
   */
  async loadScripts(scripts) {
    const promises = scripts.map((script) => this.loadScript(script));
    await Promise.all(promises);
  }

  /**
   * Charge tous les modules de l'application
   * @returns {Promise<void>}
   */
  async loadAllModules() {
    try {
      console.log('🚀 Chargement des modules HackOS...');

      // Charger les utilitaires en premier
      await this.loadScripts(AppConfig.modules.utils);
      console.log('✅ Utilitaires chargés');

      // Charger les composants
      await this.loadScripts(AppConfig.modules.components);
      console.log('✅ Composants chargés');

      // Charger les modules principaux
      await this.loadScripts(AppConfig.modules.modules);
      console.log('✅ Modules principaux chargés');

      console.log('🎉 Tous les modules ont été chargés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des modules:', error);
      throw error;
    }
  }
}

/**
 * Gestionnaire de l'initialisation de l'application
 */
class AppInitializer {
  constructor() {
    this.moduleLoader = new ModuleLoader();
    this.isInitialized = false;
  }

  /**
   * Initialise l'application
   */
  async init() {
    if (this.isInitialized) {
      console.warn('Application déjà initialisée');
      return;
    }

    try {
      console.log('🚀 Initialisation de HackOS...');

      // Afficher une barre de chargement
      this.showLoadingScreen();

      // Charger tous les modules
      await this.moduleLoader.loadAllModules();

      // Attendre que le DOM soit prêt
      await this.waitForDOM();

      // Initialiser le gestionnaire d'application
      this.initializeAppManager();

      // Masquer la barre de chargement
      this.hideLoadingScreen();

      this.isInitialized = true;
      console.log('🎉 HackOS initialisé avec succès!');
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Affiche un écran de chargement
   * @private
   */
  showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'hackos-loading';
    loadingScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-family: 'VT323', monospace;
                font-size: 24px;
            ">
                <div style="text-align: center;">
                    <div>🔧 Chargement de HackOS...</div>
                    <div style="margin-top: 20px;">
                        <div style="width: 200px; height: 10px; background: #333; border: 1px solid #666;">
                            <div id="loading-progress" style="width: 0%; height: 100%; background: #0f0; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(loadingScreen);

    // Animation de la barre de progression
    let progress = 0;
    const progressBar = document.getElementById('loading-progress');
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + '%';
    }, 100);

    // Compléter à 100% après 2 secondes
    setTimeout(() => {
      clearInterval(interval);
      progressBar.style.width = '100%';
    }, 2000);
  }

  /**
   * Masque l'écran de chargement
   * @private
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('hackos-loading');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s';
      setTimeout(() => loadingScreen.remove(), 500);
    }
  }

  /**
   * Affiche un écran d'erreur
   * @private
   * @param {Error} error - L'erreur survenue
   */
  showErrorScreen(error) {
    const errorScreen = document.createElement('div');
    // Build content with a reload button that we'll bind via JS (avoid inline onclick)
    errorScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(139,0,0,0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-family: 'VT323', monospace;
                font-size: 18px;
            ">
                <div style="text-align: center; max-width: 600px; padding: 20px;">
                    <h2>❌ Erreur de chargement</h2>
                    <p>Une erreur est survenue lors du chargement de HackOS:</p>
                    <pre id="hackos-error-message" style="background: rgba(0,0,0,0.5); padding: 10px; margin: 20px 0;"></pre>
                    <button id="hackos-reload-btn" style="
                        background: #0f0;
                        color: black;
                        border: none;
                        padding: 10px 20px;
                        font-family: 'VT323', monospace;
                        font-size: 16px;
                        cursor: pointer;
                    ">Recharger la page</button>
                </div>
            </div>
        `;

    document.body.appendChild(errorScreen);

    // Fill error message safely (avoid injecting unsanitized HTML)
    const msgEl = document.getElementById('hackos-error-message');
    if (msgEl)
      msgEl.textContent =
        error && error.message ? error.message : String(error);

    // Attach click handler to reload button
    const btn = document.getElementById('hackos-reload-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        try {
          // Optionally send telemetry here
        } finally {
          location.reload();
        }
      });
    }
  }

  /**
   * Attend que le DOM soit prêt
   * @private
   * @returns {Promise<void>}
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialise le gestionnaire d'application
   * @private
   */
  initializeAppManager() {
    if (window.AppManager) {
      window.AppManager.initialize();
    } else {
      console.error('AppManager non disponible');
    }
  }
}

// Initialisation automatique lors du chargement de la page
const appInitializer = new AppInitializer();

// Démarrer l'initialisation dès que possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => appInitializer.init());
} else {
  appInitializer.init();
}

// Export global pour debug
window.HackOS = {
  initializer: appInitializer,
  config: AppConfig,
  version: '2.0.0',
};
