/**
 * Utilitaire pour construire et manipuler les éléments HTML
 */
class HTMLBuilder {
    /**
     * Construit un élément HTML avec les propriétés spécifiées
     * @param {string} type - Le type d'élément à créer
     * @param {Object} properties - Les propriétés à appliquer à l'élément
     * @returns {HTMLElement} L'élément créé
     */
    static build(type, properties = {}) {
        const element = document.createElement(type);
        for (const property in properties) {
            element[property] = properties[property];
        }
        return element;
    }

    /**
     * Rend un élément draggable (déplaçable)
     * @param {HTMLElement} element - L'élément à rendre draggable
     */
    static makeDraggable(element) {
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                element.style.position = 'absolute';
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

// Alias non-casse pour compatibilité avec l'ancien code qui utilisait `HTMLbuilder`
window.HTMLbuilder = HTMLBuilder;
