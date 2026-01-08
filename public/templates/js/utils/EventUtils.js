/**
 * Utilitaires pour la gestion des événements
 */
if (typeof EventUtils === 'undefined') {
  class EventUtils {
    /**
     * Gère le double-clic sur un élément
     */
    static onDoubleClick(element, callback, threshold = 200) {
      let lastClick = 0;

      element.onclick = () => {
        const now = Date.now();
        if (now - lastClick < threshold) {
          callback();
          lastClick = 0;
        } else {
          lastClick = now;
        }
      };
    }

    /**
     * Gestionnaire pour les éléments draggables dans la barre d'applications
     */
    static setupAppDragAndDrop(apps) {
      console.log('🎮 setupAppDragAndDrop appelé avec', apps.length, 'apps');

      apps.forEach((app) => {
        // Ne pas configurer le drag pour la corbeille
        if (app.id === 'bin') {
          console.log('⏭️ Skip drag config pour bin');
          return;
        }

        console.log('🔧 Configuration drag pour:', app.id);
        app.draggable = true;

        // Empêcher la navigation du lien parent mais autoriser le drag
        const parentLink = app.closest('a');
        if (parentLink) {
          parentLink.draggable = false; // Le lien lui-même ne doit pas être draggable
          parentLink.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche la navigation uniquement
          });
          parentLink.addEventListener('dragstart', (e) => {
            e.preventDefault(); // Empêche le drag du lien
          });
        }

        app.addEventListener('dragstart', (e) => {
          console.log('🚀 DragStart sur:', app.id);
          app.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', app.id);
        });

        app.addEventListener('dragend', (e) => {
          console.log('🛑 DragEnd sur:', app.id);
          app.classList.remove('dragging');
        });
      });

      const appsContainer = document.querySelector('.apps');
      console.log('📦 appsContainer trouvé:', appsContainer);

      if (!appsContainer) return;

      console.log('✅ Ajout des événements dragover sur appsContainer');

      appsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();

        const dragging = document.querySelector('.dragging');
        if (!dragging) return;

        // Ne pas réordonner si on est au-dessus de la corbeille
        if (window.isOverBin && window.isOverBin(e.clientX, e.clientY)) {
          console.log('⏭️ Au-dessus de la corbeille, pas de réordonnancement');
          return;
        }

        const afterElement = this.getDragAfterElement(appsContainer, e.clientX);

        if (afterElement == null) {
          appsContainer.appendChild(dragging);
        } else {
          appsContainer.insertBefore(dragging, afterElement);
        }
      });

      // Ne PAS gérer le drop ici pour la corbeille - laisser Corbeille.js s'en charger
      appsContainer.addEventListener('drop', (e) => {
        e.preventDefault();

        // Si on est au-dessus de la corbeille, ne rien faire ici
        if (window.isOverBin && window.isOverBin(e.clientX, e.clientY)) {
          console.log(
            '📦 Drop au-dessus de la corbeille - géré par Corbeille.js'
          );
          return;
        }

        console.log('💧 Drop dans appsContainer (réordonnancement)');
      });
    }

    /**
     * Trouve l'élément le plus proche après la position de la souris
     */
    static getDragAfterElement(container, x) {
      const draggableElements = [
        ...container.querySelectorAll('.app:not(.dragging):not(#bin)'),
      ].filter((el) => el.style.display !== 'none');

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

  window.EventUtils = EventUtils;
}
