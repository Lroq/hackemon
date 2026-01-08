/**
 * Utilitaires pour la gestion des événements
 */
class EventUtils {
  /**
   * Gère le double-clic sur un élément
   * @param {HTMLElement} element - L'élément sur lequel écouter
   * @param {Function} callback - La fonction à exécuter lors du double-clic
   * @param {number} threshold - Le délai maximum entre les clics (ms)
   */
  static onDoubleClick(element, callback, threshold = 200) {
    let lastClick = Date.now();

    element.onclick = () => {
      if (Date.now() - lastClick < threshold) {
        callback();
        lastClick = Date.now() - threshold;
      } else {
        lastClick = Date.now();
      }
    };
  }

  /**
   * Gestionnaire pour les éléments draggables dans la barre d'applications
   * @param {NodeList} apps - Liste des applications
   */
  static setupAppDragAndDrop(apps) {
    console.log('🎮 setupAppDragAndDrop appelé avec', apps.length, 'apps');

    apps.forEach((app) => {
      // Ne pas rendre la corbeille draggable
      if (app.id === 'bin') {
        console.log('⏭️ Bin ignoré pour le drag');
        return;
      }

      console.log('🔧 Configuration drag pour:', app.id);
      app.draggable = true;

      app.addEventListener('dragstart', (e) => {
        console.log('🚀 DragStart sur:', app.id);
        app.classList.add('dragging');
        e.dataTransfer.setData('text/plain', null);
      });

      app.addEventListener('dragend', () => {
        console.log('🛑 DragEnd sur:', app.id);
        app.classList.remove('dragging');
      });
    });

    const appsContainer = document.querySelector('.apps');
    console.log('📦 appsContainer trouvé:', appsContainer);
    if (appsContainer) {
      console.log('✅ Ajout des événements dragover et drop sur appsContainer');
      appsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();

        const dragging = document.querySelector('.dragging');
        if (dragging) {
          const draggingRect = dragging.getBoundingClientRect();
          console.log('📍 Position objet en mouvement:', {
            id: dragging.id,
            x: draggingRect.left,
            y: draggingRect.top,
            width: draggingRect.width,
            height: draggingRect.height,
          });
        }

        console.log('🖱️ Position souris pendant drag:', {
          clientX: e.clientX,
          clientY: e.clientY,
        });

        // Ne pas gérer le repositionnement si on est au-dessus de la corbeille
        const binIcon = document.querySelector('#bin');
        if (binIcon) {
          const binRect = binIcon.getBoundingClientRect();
          console.log('🗑️ Position corbeille:', {
            left: binRect.left,
            top: binRect.top,
            right: binRect.right,
            bottom: binRect.bottom,
            width: binRect.width,
            height: binRect.height,
          });

          const isOverBin =
            e.clientX >= binRect.left &&
            e.clientX <= binRect.right &&
            e.clientY >= binRect.top &&
            e.clientY <= binRect.bottom;

          console.log('✅ Élément au-dessus de la corbeille?', isOverBin);

          if (isOverBin) {
            console.log('⏭️ Ignoré: drag au-dessus de la corbeille');
            return; // Ne pas repositionner
          }
        }

        const afterElement = this.getDragAfterElement(appsContainer, e.clientX);

        if (afterElement == null) {
          appsContainer.appendChild(dragging);
        } else {
          appsContainer.insertBefore(dragging, afterElement);
        }
      });

      appsContainer.addEventListener('drop', (e) => {
        console.log('💧 Drop détecté à position:', {
          clientX: e.clientX,
          clientY: e.clientY,
        });

        const dragging = document.querySelector('.dragging');
        if (dragging) {
          const draggingRect = dragging.getBoundingClientRect();
          console.log('📍 Position élément au moment du drop:', {
            id: dragging.id,
            x: draggingRect.left,
            y: draggingRect.top,
            width: draggingRect.width,
            height: draggingRect.height,
          });
        }

        // Vérifier si le drop est sur la corbeille
        const binIcon = document.querySelector('#bin');
        if (binIcon) {
          const binRect = binIcon.getBoundingClientRect();
          console.log('🗑️ Position corbeille au drop:', {
            left: binRect.left,
            top: binRect.top,
            right: binRect.right,
            bottom: binRect.bottom,
          });

          const isOverBin =
            e.clientX >= binRect.left &&
            e.clientX <= binRect.right &&
            e.clientY >= binRect.top &&
            e.clientY <= binRect.bottom;

          console.log(
            '✅ Élément au-dessus de la corbeille au drop?',
            isOverBin
          );

          if (isOverBin) {
            console.log('🗑️ Drop détecté sur corbeille depuis EventUtils');
            if (
              dragging &&
              dragging.id !== 'bin' &&
              typeof window.addToBin === 'function'
            ) {
              e.preventDefault();
              e.stopPropagation();
              window.addToBin(dragging);
            }
          }
        }
      });
    }
  }

  /**
   * Trouve l'élément le plus proche après la position de la souris
   * @param {HTMLElement} container - Le conteneur
   * @param {number} x - Position X de la souris
   * @returns {HTMLElement|null} L'élément trouvé
   */
  static getDragAfterElement(container, x) {
    const draggableElements = [
      ...container.querySelectorAll('.app:not(.dragging)'),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
}

// Export pour utilisation globale
window.EventUtils = EventUtils;
