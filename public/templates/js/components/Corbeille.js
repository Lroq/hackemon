/**
 * Système de gestion de la corbeille
 */

// Éviter les redéclarations
if (typeof window.binInitialized === 'undefined') {
  window.binInitialized = true;
  window.binItems = [];

  /**
   * Ajoute un élément à la corbeille
   * @param {HTMLElement} appElement - L'élément d'application à supprimer
   */
  window.addToBin = function (appElement) {
    if (!appElement || appElement.id === 'bin') {
      console.warn("⚠️ Tentative d'ajout invalide à la corbeille");
      return;
    }

    const appId = appElement.id;

    // Vérifier si l'élément n'est pas déjà dans la corbeille
    if (window.binItems.some((item) => item.id === appId)) {
      console.warn('⚠️ Élément déjà dans la corbeille:', appId);
      return;
    }

    const rect = appElement.getBoundingClientRect();
    const parent = appElement.parentElement;
    const parentRect = parent
      ? parent.getBoundingClientRect()
      : { left: 0, top: 0 };

    const item = {
      id: appId,
      label: appElement.querySelector('label')?.innerText || 'Item',
      iconSrc: appElement.querySelector('img')?.src || '',
      originalPosition: {
        index: parent ? Array.from(parent.children).indexOf(appElement) : 0,
      },
      savedPosition: {
        left: rect.left - parentRect.left,
        top: rect.top - parentRect.top,
      },
    };

    window.binItems.push(item);

    // Cacher ET désactiver le drag
    appElement.style.display = 'none';
    appElement.draggable = false;
    appElement.classList.remove('dragging');

    // Refresh bin window if open
    if (window.globalCorbeilleInstance) {
      window.globalCorbeilleInstance.render();
    }

    console.log('📦 Élément ajouté à la corbeille:', item.label);
  };

  /**
   * Restaure un élément depuis la corbeille
   * @param {number} index - L'index de l'élément dans la corbeille
   */
  window.restoreFromBin = function (index) {
    if (index < 0 || index >= window.binItems.length) return;

    const item = window.binItems[index];
    const appElement = document.getElementById(item.id);

    if (appElement) {
      appElement.style.display = '';
      appElement.draggable = true;

      const appsContainer = document.querySelector('.apps');
      if (appsContainer) {
        const allApps = Array.from(appsContainer.querySelectorAll('.app'));
        const visibleApps = allApps.filter(
          (app) => app.style.display !== 'none'
        );

        let targetIndex = item.originalPosition.index;
        if (targetIndex >= visibleApps.length) {
          appsContainer.appendChild(appElement);
        } else {
          appsContainer.insertBefore(appElement, visibleApps[targetIndex]);
        }
      }

      console.log('♻️ Élément restauré:', item.label);
    }

    window.binItems.splice(index, 1);

    if (window.globalCorbeilleInstance) {
      window.globalCorbeilleInstance.render();
    }
  };

  /**
   * Vérifie si un élément est au-dessus de la corbeille
   * @param {number} x - Position X de la souris
   * @param {number} y - Position Y de la souris
   * @returns {boolean}
   */
  window.isOverBin = function (x, y) {
    const binIcon = document.querySelector('#bin');
    if (!binIcon) return false;

    const rect = binIcon.getBoundingClientRect();
    const margin = 10; // Marge de tolérance
    return (
      x >= rect.left - margin &&
      x <= rect.right + margin &&
      y >= rect.top - margin &&
      y <= rect.bottom + margin
    );
  };

  /**
   * Initialise les événements de drag and drop pour la corbeille
   */
  window.initializeBinDragAndDrop = function () {
    console.log('🚀 Initialisation du drag and drop de la corbeille...');

    const binIcon = document.querySelector('#bin');
    if (!binIcon) {
      console.error('❌ Bin icon non trouvé!');
      return;
    }

    console.log('🗑️ Bin icon trouvé:', binIcon);

    // Désactiver le drag de l'icône bin elle-même
    binIcon.draggable = false;
    binIcon.style.cursor = 'pointer';

    // Gestionnaire dragover sur la corbeille
    binIcon.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();

      binIcon.style.transform = 'scale(1.2)';
      binIcon.style.transition = 'transform 0.2s';
      binIcon.style.filter = 'brightness(1.2)';
    });

    binIcon.addEventListener('dragleave', (e) => {
      binIcon.style.transform = 'scale(1)';
      binIcon.style.filter = 'brightness(1)';
    });

    // Gestionnaire drop sur la corbeille (phase capture)
    binIcon.addEventListener(
      'drop',
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('🔥 Drop sur la corbeille!');

        const draggingApp = document.querySelector('.app.dragging');
        console.log('📱 App en cours de drag:', draggingApp?.id);

        if (draggingApp && draggingApp.id !== 'bin') {
          window.addToBin(draggingApp);
          console.log('✅ Élément déposé dans la corbeille');
        }

        binIcon.style.transform = 'scale(1)';
        binIcon.style.filter = 'brightness(1)';
      },
      true
    );

    console.log('✅ Drag and drop corbeille initialisé');
  };
}

/**
 * Classe Corbeille - Fenêtre de gestion de la corbeille
 */
if (typeof Corbeille === 'undefined') {
  class Corbeille extends Window {
    constructor() {
      super(30, 50, true, 'Corbeille');
      window.globalCorbeilleInstance = this;

      if (!window.binItems) {
        window.binItems = [];
      }

      this.render();
    }

    render() {
      const holderContent = this._getHolderContent();
      if (!holderContent) return;

      holderContent.innerHTML = '';

      if (window.binItems && window.binItems.length > 0) {
        const gridContainer = HTMLbuilder.build('div', {
          style:
            'display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px; padding: 20px; width: 100%;',
        });

        window.binItems.forEach((item, index) => {
          const itemDiv = HTMLbuilder.build('div', {
            className: 'bin-item',
            draggable: true,
            style:
              'text-align: center; cursor: move; padding: 10px; border-radius: 5px; transition: background 0.2s;',
          });
          itemDiv.dataset.itemId = item.id;
          itemDiv.dataset.itemIndex = index;

          const img = HTMLbuilder.build('img', {
            src: item.iconSrc,
            style:
              'width: 40px; height: 40px; display: block; margin: 0 auto 5px;',
          });

          const label = HTMLbuilder.build('label', {
            innerText: item.label,
            style:
              'font-size: 0.8em; color: #666; display: block; word-wrap: break-word;',
          });

          itemDiv.appendChild(img);
          itemDiv.appendChild(label);

          // Double-clic pour restaurer
          itemDiv.addEventListener('dblclick', () => {
            window.restoreFromBin(index);
          });

          // Drag depuis la corbeille
          itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('binItemIndex', index.toString());
            e.dataTransfer.setData('fromBin', 'true');
            itemDiv.style.opacity = '0.5';
          });

          itemDiv.addEventListener('dragend', (e) => {
            itemDiv.style.opacity = '1';
            // Restaurer si droppé en dehors de la corbeille
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            if (dropTarget && !dropTarget.closest('.window.Corbeille')) {
              window.restoreFromBin(index);
            }
          });

          itemDiv.addEventListener('mouseenter', () => {
            itemDiv.style.background = 'rgba(0,0,0,0.05)';
          });
          itemDiv.addEventListener('mouseleave', () => {
            itemDiv.style.background = 'transparent';
          });

          gridContainer.appendChild(itemDiv);
        });

        holderContent.appendChild(gridContainer);
      } else {
        const p = HTMLbuilder.build('p', {
          innerText: 'Votre corbeille est vide.',
          style: 'text-align: center; color: #888; margin-top: 20px;',
        });

        const binImg = HTMLbuilder.build('img', {
          src: '/public/assets/empty-bin.png',
          style:
            'width: 20%; max-width: 150px; min-width: 0; height: auto; display: block; margin: 20px auto; opacity: 0.5;',
        });

        holderContent.appendChild(binImg);
        holderContent.appendChild(p);
      }
    }

    _getHolderContent() {
      return (
        document.querySelector('.window.Corbeille .holder > div') ||
        document.querySelector(
          'main > .windows .window:last-child .holder > div'
        )
      );
    }
  }

  window.Corbeille = Corbeille;
}
