if (window.Register && window.Register.__hackos) {
  // Déjà défini par HackOS: on ignore sans bruit.
} else {
  /**
   * Composant pour la fenêtre d'inscription
   */
  class Register extends Window {
    constructor() {
      super(20, 50, true, "S'inscrire"); // Hauteur, largeur, fermable, titre
      this.onLoginSuccess = null; // Callback pour redirection après inscription
      this.expandedHeight = 37; // Hauteur avec texte d'erreur
      this.initializeRegister();
    }

  /**
   * Initialise le formulaire d'inscription
   * @private
   */
  initializeRegister() {
    const form = this.createRegisterForm();
    this.append(form);
  }

  /**
   * Crée le formulaire d'inscription
   * @private
   * @returns {HTMLElement} Le formulaire
   */
  createRegisterForm() {
    const form = HTMLBuilder.build("form", {
      style:
        "display:flex; width: 100%; max-height: 100%; overflow:auto; flex-direction: column; justify-content: center; z-index: 2; margin-top: 10px;",
    });

    // Champs du formulaire
    const emailInput = HTMLBuilder.build("input", {
      type: "email",
      placeholder: "Email",
      required: true,
    });

    const usernameInput = HTMLBuilder.build("input", {
      type: "text",
      placeholder: "Nom d'utilisateur",
      required: true,
    });

    // Champ mot de passe avec bouton afficher/masquer
    const passwordContainer = HTMLBuilder.build("div", {
      style: "position: relative; width: 100%;",
    });

    const passwordInput = HTMLBuilder.build("input", {
      type: "password",
      placeholder: "Mot de passe",
      required: true,
      minLength: 12,
      style:
        "padding: 10px; padding-right: 40px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;",
    });

    const togglePassword = HTMLBuilder.build("button", {
      type: "button",
      innerHTML: '<i class="fa-solid fa-eye" style="color:#aaa;"></i>',
      style:
        "position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2em; outline: none; box-shadow: none; filter: none;",
    });

    togglePassword.onclick = () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      togglePassword.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash" style="color:#aaa;"></i>'
        : '<i class="fa-solid fa-eye" style="color:#aaa;"></i>';
    };

    passwordContainer.append(passwordInput, togglePassword);

    const submitButton = HTMLBuilder.build("input", {
      type: "submit",
      value: "S'inscrire",
    });

    // Message d'erreur
    const errorMsg = HTMLBuilder.build("p", {
      style:
        "color: red; display: none; min-height: 1.2em; margin-top: 5px; text-align: center;",
    });

    // Ajout des événements pour cacher l'erreur quand l'utilisateur tape
    [emailInput, usernameInput, passwordInput].forEach((input) => {
      input.addEventListener("input", () => {
        if (errorMsg.style.display === "block") {
          this.hideError(errorMsg);
        }
      });
    });

    // Gestionnaire de soumission
    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.handleRegister(
        emailInput.value,
        usernameInput.value,
        passwordInput.value,
        errorMsg
      );
    };

    // Bouton pour retourner à la connexion
    const loginButton = this.createLoginButton();

    // Assemblage du formulaire
    form.append(
      emailInput,
      usernameInput,
      passwordContainer,
      submitButton,
      errorMsg,
      loginButton
    );

    return form;
  }

  /**
   * Crée le bouton pour retourner à la connexion
   * @private
   * @returns {HTMLElement} Le bouton
   */
  createLoginButton() {
    const loginButton = HTMLBuilder.build("button", {
      innerText: "< Retour",
      style:
        "color:rgb(86, 86, 86); margin-top: 5px; background:none; filter: none; height:2vw;",
      type: "button",
    });

    loginButton.onclick = () => {
      this.openLogin();
    };

    return loginButton;
  }

  /**
   * Gère la tentative d'inscription
   * @private
   * @param {string} email - Email
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @param {HTMLElement} errorMsg - Élément pour afficher les erreurs
   */
  async handleRegister(email, username, password, errorMsg) {
    try {
      this.hideError(errorMsg);

      // Validation côté client
      if (!this.validateInputs(email, username, password, errorMsg)) {
        return;
      }

      const result = await ApiService.register(email, username, password);

      if (result.success) {
        this.delete();
        if (window.Swal) {
          Swal.fire({
            icon: 'success',
            title: 'Inscription réussie',
            text: 'Vous pouvez maintenant vous connecter.',
            confirmButtonColor: '#3085d6'
          });
        } else {
          alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        }

        // Ouvrir automatiquement la fenêtre de connexion
        this.openLogin();
      } else {
        this.showError(errorMsg, result.error || "Erreur d'inscription");
      }
    } catch (error) {
      this.showError(errorMsg, error.message || "Erreur serveur");
    }
  }

  /**
   * Valide les données d'entrée côté client
   * @private
   * @param {string} email - Email
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @param {HTMLElement} errorMsg - Élément pour afficher les erreurs
   * @returns {boolean} True si les données sont valides
   */
  validateInputs(email, username, password, errorMsg) {
    if (!email || !username || !password) {
      this.showError(errorMsg, "Tous les champs sont obligatoires");
      return false;
    }

    if (password.length < 12) {
      this.showError(
        errorMsg,
        "Le mot de passe doit contenir au moins 12 caractères"
      );
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.showError(errorMsg, "Format d'email invalide");
      return false;
    }

    return true;
  }

  /**
   * Vérifie si l'email est valide
   * @private
   * @param {string} email - Email à vérifier
   * @returns {boolean} True si l'email est valide
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Affiche un message d'erreur et agrandit la fenêtre si nécessaire
   * @private
   * @param {HTMLElement} errorMsg - Élément pour afficher l'erreur
   * @param {string} message - Message d'erreur
   */
  showError(errorMsg, message) {
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
    if (!this.isExpanded) {
      this.resize(this.expandedHeight, 50);
      this.isExpanded = true;
    }
  }

  /**
   * Cache le message d'erreur et restaure la taille originale
   * @private
   * @param {HTMLElement} errorMsg - Élément d'erreur à cacher
   */
  hideError(errorMsg) {
    errorMsg.style.display = "none";
    if (this.isExpanded) {
      this.resize(this.originalHeight, 50);
      this.isExpanded = false;
    }
  }

  /**
   * Ouvre la fenêtre de connexion
   * @private
   */
  openLogin() {
    this.delete();
    const loginWindow = new Login();

    // Transférer le callback de succès si nécessaire
    loginWindow.onLoginSuccess = this.onLoginSuccess;
  }
  }

  Register.__hackos = true;
  window.Register = Register;
}
