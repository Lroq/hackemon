class Login extends Window {
  constructor() {
    super(20, 20, true, 'Se connecter');
    this.onLoginSuccess = null; // Callback pour le succès de connexion
    this.initializeLogin();
  }

  /**
   * Initialise le formulaire de connexion
   * @private
   */
  initializeLogin() {
    const form = this.createLoginForm();
    this.append(form);
  }

  /**
   * Crée le formulaire de connexion
   * @private
   * @returns {HTMLElement} Le formulaire
   */
  createLoginForm() {
    const form = HTMLBuilder.build('form', {
      style:
        'display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center',
    });

    // Champs du formulaire
    const usernameInput = HTMLBuilder.build('input', {
      type: 'text',
      placeholder: "Nom d'utilisateur",
      required: true,
    });

    const passwordInput = HTMLBuilder.build('input', {
      type: 'password',
      placeholder: 'Mot de passe',
      required: true,
    });

    const submitButton = HTMLBuilder.build('input', {
      type: 'submit',
      value: 'Se connecter',
    });

    // Message d'erreur
    const errorMsg = HTMLBuilder.build('p', {
      style: 'color: red; display: none;',
    });

    // Gestionnaire de soumission
    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.handleLogin(
        usernameInput.value,
        passwordInput.value,
        errorMsg
      );
    };

    // Bouton pour aller vers l'inscription
    const registerButton = this.createRegisterButton();

    // Assemblage du formulaire
    form.append(
      usernameInput,
      passwordInput,
      submitButton,
      errorMsg,
      registerButton
    );

    return form;
  }

  /**
   * Crée le bouton pour aller vers l'inscription
   * @private
   * @returns {HTMLElement} Le bouton
   */
  createRegisterButton() {
    const registerButton = HTMLBuilder.build('button', {
      innerText: "S'inscrire >",
      style:
        'background: none; color: white; margin-top: 10px; filter: none; height: 2vw; color: rgb(86, 86, 86);',
      type: 'button',
    });

    registerButton.onclick = () => {
      this.openRegister();
    };

    return registerButton;
  }

  /**
   * Gère la tentative de connexion
   * @private
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @param {HTMLElement} errorMsg - Élément pour afficher les erreurs
   */
  async handleLogin(username, password, errorMsg) {
    try {
      errorMsg.style.display = 'none';

      const result = await ApiService.login(username, password);

      if (result && result.success) {
        this.delete();

        // Charger le profil utilisateur
        const user = await this.loadUserProfile();

        // Essayer de mettre à jour l'UI globale sans recharger
        try {
          if (
            window.UserProfile &&
            typeof window.UserProfile.refresh === 'function'
          ) {
            const refreshed = await window.UserProfile.refresh();
            // Si refresh n'a pas réussi à récupérer le user, on force un reload
            if (!refreshed) {
              location.reload();
            }
          } else if (
            window.UserProfile &&
            typeof window.UserProfile.set === 'function'
          ) {
            window.UserProfile.set(user && (user.user || user));
          } else {
            // Pas d'API disponible côté client pour mettre à jour, on reload
            location.reload();
          }
        } catch (err) {
          console.error(
            'Erreur lors de la mise à jour du profil après login:',
            err
          );
          location.reload();
        }

        // Appeler le callback si défini
        if (this.onLoginSuccess) {
          this.onLoginSuccess(user);
        }
      } else {
        this.showError(
          errorMsg,
          (result && result.error) || 'Erreur de connexion'
        );
      }
    } catch (error) {
      this.showError(errorMsg, error.message || 'Erreur serveur');
    }
  }

  /**
   * Charge le profil utilisateur après connexion
   * @private
   * @returns {Promise<Object>} Les données utilisateur
   */
  async loadUserProfile() {
    try {
      return await ApiService.getProfile();
    } catch (error) {
      console.error('Erreur de récupération du profil:', error);
      return { username: 'Utilisateur' }; // Fallback
    }
  }

  /**
   * Affiche un message d'erreur
   * @private
   * @param {HTMLElement} errorMsg - Élément pour afficher l'erreur
   * @param {string} message - Message d'erreur
   */
  showError(errorMsg, message) {
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
  }

  /**
   * Ouvre la fenêtre d'inscription
   * @private
   */
  openRegister() {
    this.delete();
    const registerWindow = new Register();

    // Transférer le callback de succès si nécessaire
    registerWindow.onLoginSuccess = this.onLoginSuccess;
  }
}

// Export pour utilisation globale
window.Login = Login;
