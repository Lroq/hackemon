if (window.Menu && window.Menu.__hackos) {
    // Déjà défini par HackOS: on ignore sans bruit.
} else {
    /**
     * Composant Menu principal de l'application
     */
    class Menu extends Window {
        constructor() {
            super(50, 50, true, "Menu");
            this.initializeMenu();
        }

    /**
     * Initialise le contenu du menu
     * @private
     */
    initializeMenu() {
        // Titre de bienvenue
        const title = HTMLBuilder.build("h1", {
            innerText: "Bienvenue sur HackOS",
            style: "color: #b2533f;"
        });

        // Description
        const description = HTMLBuilder.build("p", {
            innerText: "Apprenez à vous prémunir contre les menaces liées à la cybersécurité!"
        });

        // Bouton de connexion
        const loginButton = HTMLBuilder.build("button", {
            innerText: "Se connecter ou s'inscrire",
            style: "background: #3e9587; color: white"
        });

        // Gestionnaire d'événement pour le bouton de connexion
        loginButton.onclick = () => {
            this.openLogin();
        };

        // Ajout des éléments au menu
        this.append(title);
        this.append(description);
        this.append(loginButton);
    }

    /**
     * Ouvre la fenêtre de connexion
     * @private
     */
    openLogin() {
        const loginWindow = new Login();
        
        // Callback pour la soumission réussie
        loginWindow.onLoginSuccess = (user) => {
            this.handleLoginSuccess(user);
        };
    }

    /**
     * Gère le succès de la connexion
     * @param {Object} user - Données utilisateur
     * @private
     */
    handleLoginSuccess(user) {
        console.log("Utilisateur connecté:", user);
        const pseudo = user.username || user.email;
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: `Bienvenue, ${pseudo} !`,
                confirmButtonColor: '#3085d6'
            });
        } else {
            alert(`Bienvenue, ${pseudo} !`);
        }
        // Ici vous pouvez ajouter d'autres actions post-connexion
    }
    }

    // Export pour utilisation globale
    Menu.__hackos = true;
    window.Menu = Menu;
}
