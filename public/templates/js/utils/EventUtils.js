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
        apps.forEach(app => {
            app.draggable = true;

            app.addEventListener("dragstart", (e) => {
                app.classList.add("dragging");
                e.dataTransfer.setData("text/plain", null);
            });

            app.addEventListener("dragend", () => {
                app.classList.remove("dragging");
            });
        });

        const appsContainer = document.querySelector(".apps");
        if (appsContainer) {
            appsContainer.addEventListener("dragover", (e) => {
                e.preventDefault();
                const dragging = document.querySelector(".dragging");
                const afterElement = this.getDragAfterElement(appsContainer, e.clientX);
                
                if (afterElement == null) {
                    appsContainer.appendChild(dragging);
                } else {
                    appsContainer.insertBefore(dragging, afterElement);
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
        const draggableElements = [...container.querySelectorAll(".app:not(.dragging)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// Export pour utilisation globale
window.EventUtils = EventUtils;
