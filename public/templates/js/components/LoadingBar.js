/**
 * Composant pour afficher une barre de progression
 */
if (!window.LoadingBar) {
  window.LoadingBar = class LoadingBar extends Window {
    constructor(title) {
      super(10, 20, false, title);
      this.initializeLoadingBar();
    }

    /**
     * Initialise la barre de progression
     * @private
     */
    initializeLoadingBar() {
      const wrapper = HTMLBuilder.build('div', {
        style:
          'display:flex;width: 100%; height: 100%; justify-content: center; align-items: center;',
      });

      const loadBarBack = HTMLBuilder.build('div', {
        style:
          'display:flex; width: 80%; height: 20%; background: black; overflow: hidden',
      });

      const loadBar = HTMLBuilder.build('div', {
        style:
          'display:flex; width: 0%; height: 100%; background: green; overflow: hidden; transition: width 0.1s ease;',
      });

      loadBarBack.appendChild(loadBar);
      wrapper.appendChild(loadBarBack);
      this.append(wrapper);

      this.startProgress(loadBar);
    }

    /**
     * Démarre l'animation de progression
     * @private
     * @param {HTMLElement} loadBar - Élément de la barre de progression
     */
    startProgress(loadBar) {
      let progress = 0;
      const increment = 10;
      const interval = 100;

      const progressInterval = setInterval(() => {
        progress += increment;
        loadBar.style.width = `${Math.min(progress, 100)}%`;

        if (progress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            this.onLoaded();
          }, 200);
        }
      }, interval);
    }

    /**
     * Méthode appelée lorsque le chargement est terminé
     * Doit être surchargée dans les classes héritées
     */
    onLoaded() {
      console.warn('LoadingBar: onLoaded method should be overridden');
      this.delete();
    }

    /**
     * Définit la callback à exécuter à la fin du chargement
     * @param {Function} callback - Fonction à exécuter
     */
    setOnLoaded(callback) {
      this.onLoaded = callback;
    }
  };
}
