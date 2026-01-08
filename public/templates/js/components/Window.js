/**
 * Classe de base pour toutes les fenêtres de l'application
 */
if (!window.Window) {
  window.Window = class Window {
    static States = {};
    static currentZIndex = 1;
    #window;
    #title;

    /**
     * Constructeur de la classe Window
     * @param {number} height
     * @param {number} width
     * @param {boolean} closeable
     * @param {string} title
     */
    constructor(height, width, closeable, title = Math.random().toString()) {
      // Évite la création de doublons
      if (Window.States[title]) {
        return;
      }

      this.#title = title;
      Window.States[title] = true;

      this.#window = this.createWindow(height, width, closeable, title);
      this.setupWindowDrag();

      // Assure que la nouvelle fenêtre apparaît devant toutes les autres
      //Window.currentZIndex++;
      this.#window.style.zIndex = Window.currentZIndex;

      document.body.querySelector('main > .windows').appendChild(this.#window);
      HTMLBuilder.makeDraggable(this.#window);
    }

    /**
     * Crée la structure HTML de la fenêtre
     * @private
     */
    createWindow(height, width, closeable, title) {
      const windowElement = HTMLBuilder.build('div', {
        className: `window ${closeable ? 'closeable' : ''}`,
        style: `height: ${height}vw; width: ${width}vw;`,
      });

      // Création de la barre de titre
      const topBar = this.createTopBar(title, closeable);
      const content = this.createContent();

      windowElement.appendChild(topBar);
      windowElement.appendChild(content);

      return windowElement;
    }

    /**
     * Crée la barre de titre de la fenêtre
     * @private
     */
    createTopBar(title, closeable) {
      const topBar = HTMLBuilder.build('div', { className: 'topbar' });

      topBar.appendChild(
        HTMLBuilder.build('img', { src: '/public/assets/left_bar_px.png' })
      );
      topBar.appendChild(
        HTMLBuilder.build('img', {
          className: 'mid',
          src: '/public/assets/mid_bar_px.png',
        })
      );
      topBar.appendChild(
        HTMLBuilder.build('img', { src: '/public/assets/right_bar_px.png' })
      );

      const label = HTMLBuilder.build('label', {
        className: 'app-name',
        innerText: title,
      });
      topBar.appendChild(label);

      if (closeable) {
        const closeButton = HTMLBuilder.build('img', {
          className: 'app-close',
          src: '/public/assets/close_px.png',
          draggable: false,
        });
        closeButton.addEventListener('click', () => this.delete());
        topBar.appendChild(closeButton);
      }

      return topBar;
    }

    /**
     * Crée le contenu de la fenêtre
     * @private
     */
    createContent() {
      const content = HTMLBuilder.build('div', { className: 'content' });

      const leftSection = HTMLBuilder.build('div', {});
      leftSection.appendChild(
        HTMLBuilder.build('img', { src: '/public/assets/left_content_px.png' })
      );
      leftSection.appendChild(
        HTMLBuilder.build('img', {
          src: '/public/assets/left_content_bottom_px.png',
        })
      );

      const holder = HTMLBuilder.build('div', { className: 'holder' });
      holder.appendChild(HTMLBuilder.build('div', {}));
      holder.appendChild(
        HTMLBuilder.build('img', {
          src: '/public/assets/mid_content_bottom_px.png',
        })
      );

      const rightSection = HTMLBuilder.build('div', {});
      rightSection.appendChild(
        HTMLBuilder.build('img', { src: '/public/assets/right_content_px.png' })
      );
      rightSection.appendChild(
        HTMLBuilder.build('img', {
          src: '/public/assets/right_content_bottom_px.png',
        })
      );

      content.appendChild(leftSection);
      content.appendChild(holder);
      content.appendChild(rightSection);

      return content;
    }

    /**
     * Configure le drag and drop pour la fenêtre
     * @private
     */
    setupWindowDrag() {
      const topbar = this.#window.querySelector('.topbar');
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      topbar.addEventListener('mousedown', (e) => {
        isDragging = true;
        this.#window.classList.add('dragging');

        const rect = this.#window.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Amène la fenêtre au premier plan quand on clique dessus
        Window.currentZIndex++;
        this.#window.style.zIndex = Window.currentZIndex;
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        this.#window.style.left = `${x}px`;
        this.#window.style.top = `${y}px`;
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.#window.classList.remove('dragging');
        }
      });

      // Amène la fenêtre au premier plan quand on clique dessus (pas seulement sur la barre de titre)
      this.#window.addEventListener('mousedown', (e) => {
        // Évite le conflit avec le drag de la barre de titre
        if (!e.target.closest('.topbar')) {
          Window.currentZIndex++;
          this.#window.style.zIndex = Window.currentZIndex;
        }
      });
    }

    /**
     * Supprime la fenêtre
     */
    delete() {
      Window.States[this.#title] = false;
      this.#window.remove();
    }

    /**
     * Redimensionne la fenêtre
     * @param {number} height - Nouvelle hauteur
     * @param {number} width - Nouvelle largeur
     */
    resize(height, width) {
      this.#window.style.height = `${height}vw`;
      this.#window.style.width = `${width}vw`;
    }

    /**
     * Renomme la fenêtre
     * @param {string} name - Nouveau nom
     */
    rename(name) {
      const label = this.#window.querySelector('.topbar .app-name');
      if (label) {
        label.innerText = name;
      }
    }

    /**
     * Ajoute un élément au contenu de la fenêtre
     * @param {HTMLElement} element - Élément à ajouter
     */
    append(element) {
      this.#window.querySelector('.holder > div').appendChild(element);
    }

    /**
     * Récupère l'élément DOM de la fenêtre
     * @returns {HTMLElement} L'élément de la fenêtre
     */
    getElement() {
      return this.#window;
    }
  };
}
