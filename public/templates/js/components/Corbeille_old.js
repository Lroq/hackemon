/**
 * Système de gestion de la corbeille
 */

// Bin management system
window.binItems = window.binItems || [];

/**
 * Ajoute un élément à la corbeille
 * @param {HTMLElement} appElement - L'élément d'application à supprimer
 */
function addToBin(appElement) {
  const appId = appElement.id;
  const rect = appElement.getBoundingClientRect();
  const parentRect = appElement.parentElement.getBoundingClientRect();

  const item = {
    id: appId,
    label: appElement.querySelector('label')?.innerText || 'Item',
    iconSrc: appElement.querySelector('img')?.src || '',
    originalPosition: {
      index: Array.from(appElement.parentElement.children).indexOf(
        appElement.parentElement
      ),
    },
    savedPosition: {
      left: rect.left - parentRect.left,
      top: rect.top - parentRect.top,
    },
  };

  window.binItems.push(item);
  appElement.style.display = 'none';

  // Refresh bin window if open
  if (window.globalCorbeilleInstance) {
    window.globalCorbeilleInstance.render();
  }

  console.log('📦 Élément ajouté à la corbeille:', item.label);
}

/**
 * Restaure un élément depuis la corbeille
 * @param {number} index - L'index de l'élément dans la corbeille
 */
function restoreFromBin(index) {
  if (index < 0 || index >= window.binItems.length) return;

  const item = window.binItems[index];
  const appElement = document.getElementById(item.id);

  if (appElement) {
    appElement.style.display = '';

    // Find if position is occupied and shift if needed
    const appsContainer = document.querySelector('.apps');
    const allApps = Array.from(appsContainer.querySelectorAll('.app'));
    const visibleApps = allApps.filter((app) => app.style.display !== 'none');

    // Try to insert at original position
    let targetIndex = item.originalPosition.index;
    if (targetIndex >= visibleApps.length) {
      appsContainer.appendChild(appElement.parentElement);
    } else {
      appsContainer.insertBefore(
        appElement.parentElement,
        visibleApps[targetIndex].parentElement
      );
    }

    console.log('♻️ Élément restauré:', item.label);
  }

  // Remove from bin
  window.binItems.splice(index, 1);

  // Refresh bin window if open
  if (window.globalCorbeilleInstance) {
    window.globalCorbeilleInstance.render();
  }
}

/**
 * Vérifie si un élément est au-dessus de la corbeille
 * @param {number} x - Position X de la souris
 * @param {number} y - Position Y de la souris
 * @returns {boolean}
 */
function isOverBin(x, y) {
  const binIcon = document.querySelector('#bin');
  if (!binIcon) return false;

  const rect = binIcon.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Initialise les événements de drag and drop pour la corbeille
 */
function initializeBinDragAndDrop() {
  console.log('🚀 Initialisation du drag and drop de la corbeille...');
  const binIcon = document.querySelector('#bin');
  console.log('🗑️ Bin icon trouvé:', binIcon);
  if (!binIcon) {
    console.error('❌ Bin icon non trouvé!');
    return;
  }

  // Désactiver le drag de l'icône bin elle-même
  binIcon.setAttribute('draggable', 'false');
  binIcon.draggable = false;
  binIcon.style.cursor = 'pointer';
  console.log('✅ Bin configuré comme non-draggable');

  let isOverBinIcon = false;

  // Empêcher le comportement par défaut sur l'icône de la corbeille
  binIcon.addEventListener(
    'dragover',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOverBinIcon = true;
      binIcon.style.transform = 'scale(1.2)';
      binIcon.style.transition = 'transform 0.2s';
      binIcon.style.filter = 'brightness(1.2)';
      console.log("🎯 Survol direct de l'icône corbeille");
    },
    true
  );

  binIcon.addEventListener('dragleave', (e) => {
    isOverBinIcon = false;
    binIcon.style.transform = 'scale(1)';
    binIcon.style.filter = 'brightness(1)';
    console.log("👋 Sortie de l'icône corbeille");
  });

  binIcon.addEventListener(
    'drop',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔥 Drop directement sur l'icône de la corbeille");

      const draggingApp = document.querySelector('.app.dragging');
      console.log('📱 App en cours de drag:', draggingApp?.id);

      if (draggingApp && draggingApp.id !== 'bin') {
        addToBin(draggingApp);
        console.log('✅ Élément déposé dans la corbeille');
      }

      binIcon.style.transform = 'scale(1)';
      binIcon.style.filter = 'brightness(1)';
      isOverBinIcon = false;
    },
    true
  );

  // Écouter les événements de drag sur le document (backup)
  document.addEventListener('dragover', (e) => {
    e.preventDefault(); // Nécessaire pour permettre le drop
    const wasOverBin = isOverBinIcon;
    isOverBinIcon = isOverBin(e.clientX, e.clientY);

    // Mettre à jour le style de la corbeille
    if (isOverBinIcon && !wasOverBin) {
      binIcon.style.transform = 'scale(1.2)';
      binIcon.style.transition = 'transform 0.2s';
      binIcon.style.filter = 'brightness(1.2)';
      console.log('🎯 Survol de la corbeille détecté');
    } else if (!isOverBinIcon && wasOverBin) {
      binIcon.style.transform = 'scale(1)';
      binIcon.style.filter = 'brightness(1)';
      console.log('👋 Sortie de la corbeille');
    }
  });

  // Intercepter le drop avant que le appsContainer ne le traite
  document.addEventListener(
    'drop',
    (e) => {
      console.log('🔥 Drop détecté à position:', e.clientX, e.clientY);
      console.log('🗑️ isOverBin résultat:', isOverBin(e.clientX, e.clientY));

      // Vérifier si le drop est sur la corbeille
      if (isOverBin(e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();

        console.log('✋ Drop intercepté sur la corbeille');

        const fromBin = e.dataTransfer.getData('fromBin');
        console.log('📦 fromBin:', fromBin);

        if (!fromBin) {
          // Dropping app into bin
          const draggingApp = document.querySelector('.app.dragging');
          console.log('📱 App en cours de drag:', draggingApp?.id);
          if (draggingApp && draggingApp.id !== 'bin') {
            addToBin(draggingApp);
            console.log('✅ Élément déposé dans la corbeille');
          }
        }
      }

      // Réinitialiser le style
      binIcon.style.transform = 'scale(1)';
      binIcon.style.filter = 'brightness(1)';
      isOverBinIcon = false;
    },
    true
  ); // Utiliser la phase de capture pour intercepter avant les autres handlers
}

/**
 * Classe Corbeille - Fenêtre de gestion de la corbeille
 */
class Corbeille extends Window {
  constructor() {
    super(30, 50, true, 'Corbeille');
    // Store reference to this Corbeille instance globally
    window.globalCorbeilleInstance = this;

    // Initialize bin storage if not exists
    if (!window.binItems) {
      window.binItems = [];
    }

    this.render();
  }

  render() {
    // Clear content
    const holderContent = this._getHolderContent();
    if (holderContent) {
      holderContent.innerHTML = '';
    }

    if (window.binItems && window.binItems.length > 0) {
      // Show items in grid
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

        // Drag from bin to restore
        itemDiv.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('binItemIndex', index);
          e.dataTransfer.setData('fromBin', 'true');
          itemDiv.style.opacity = '0.5';
        });

        itemDiv.addEventListener('dragend', (e) => {
          itemDiv.style.opacity = '1';
        });

        // Hover effect
        itemDiv.addEventListener('mouseenter', () => {
          itemDiv.style.background = 'rgba(0,0,0,0.05)';
        });
        itemDiv.addEventListener('mouseleave', () => {
          itemDiv.style.background = 'transparent';
        });

        gridContainer.appendChild(itemDiv);
      });

      if (holderContent) {
        holderContent.appendChild(gridContainer);
      }
    } else {
      // Empty bin
      const p = HTMLbuilder.build('p', {
        innerText: 'Votre corbeille est vide.',
        style: 'text-align: center; color: #888; margin-top: 20px;',
      });

      const binImg = HTMLbuilder.build('img', {
        src: '/public/assets/empty-bin.png',
        style:
          'width: 20%; max-width: 150px; min-width: 0; height: auto; display: block; margin: 20px auto; opacity: 0.5;',
      });

      if (holderContent) {
        holderContent.appendChild(binImg);
        holderContent.appendChild(p);
      }
    }
  }

  _getHolderContent() {
    return (
      document.querySelector('.window.Corbeille .holder > div') ||
      document.querySelector('main > .windows .window:last-child .holder > div')
    );
  }
}

// Export global functions
window.addToBin = addToBin;
window.restoreFromBin = restoreFromBin;
window.initializeBinDragAndDrop = initializeBinDragAndDrop;
