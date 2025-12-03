/**
 * Classe Login - Formulaire de connexion sécurisé
 */
class Login extends Window {
  constructor() {
    super(20, 50, true, "Se connecter");
    this.onLoginSuccess = null; // Callback pour le succès de connexion
    this.failedAttempts = 0;
    this.lockoutEndTime = null;
    this.initializeLogin();
  }

  /**
   * Initialise le formulaire de connexion
   * @private
   */
  initializeLogin() {
    const form = this.createLoginForm();
    this.append(form);

    // Vérifier si déjà verrouillé
    this.checkExistingLockout();
  }

  /**
   * Vérifie s'il y a un verrouillage existant
   * @private
   */
  checkExistingLockout() {
    const lockoutData = this.getLockoutData();
    if (lockoutData && lockoutData.endTime > Date.now()) {
      this.lockoutEndTime = lockoutData.endTime;
      this.startLockoutTimer();
    }
  }

  /**
   * Crée le formulaire de connexion
   * @private
   * @returns {HTMLElement} Le formulaire
   */
  createLoginForm() {
    const form = HTMLBuilder.build("form", {
      style:
        "display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center; gap: 10px;",
    });

    // Champs du formulaire
    const emailInput = this.createEmailInput();
    const passwordInput = this.createPasswordInput();
    const submitButton = this.createSubmitButton();

    // Message d'erreur
    const errorMsg = HTMLBuilder.build("p", {
      style: "color: red; display: none; font-size: 0.9em; margin: 5px 0;",
    });

    // Message d'information de sécurité
    const securityMsg = this.createSecurityMessage();

    // Indicateur de tentatives
    const attemptsIndicator = HTMLBuilder.build("p", {
      style: "color: orange; display: none; font-size: 0.85em; margin: 5px 0;",
    });

    // Gestionnaire de soumission
    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.handleLogin(
        emailInput.value,
        passwordInput.value,
        errorMsg,
        submitButton,
        attemptsIndicator
      );
    };

    // Bouton pour aller vers l'inscription
    const registerButton = this.createRegisterButton();

    // Lien "Mot de passe oublié"
    const forgotPasswordLink = this.createForgotPasswordLink();

    // Assemblage du formulaire
    form.append(
      emailInput,
      passwordInput,
      submitButton,
      errorMsg,
      attemptsIndicator,
      securityMsg,
      forgotPasswordLink,
      registerButton
    );

    return form;
  }

  /**
   * Crée le champ email avec validation
   * @private
   * @returns {HTMLElement}
   */
  createEmailInput() {
    const emailInput = HTMLBuilder.build("input", {
      type: "email",
      placeholder: "Adresse email",
      required: true,
      autocomplete: "email",
      style: "padding: 10px; border: 1px solid #ccc; border-radius: 4px;",
    });

    // Validation en temps réel
    emailInput.oninput = () => {
      this.validateEmail(emailInput);
    };

    return emailInput;
  }

  /**
   * Crée le champ mot de passe avec toggle de visibilité
   * @private
   * @returns {HTMLElement}
   */
  createPasswordInput() {
    const container = HTMLBuilder.build("div", {
      style: "position: relative; width: 100%;",
    });

    const passwordInput = HTMLBuilder.build("input", {
      type: "password",
      placeholder: "Mot de passe",
      required: true,
      autocomplete: "current-password",
      minLength: 8,
      style:
        "padding: 10px; padding-right: 40px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;",
    });

    // Bouton pour afficher/masquer le mot de passe (icônes Font Awesome)
    const toggleButton = HTMLBuilder.build("button", {
      type: "button",
      innerHTML: '<i class="fa-solid fa-eye" style="color:#aaa;"></i>',
      style:
        "position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2em; outline: none; box-shadow: none; filter: none;",
    });

    toggleButton.onclick = () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggleButton.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash" style="color:#aaa;"></i>'
        : '<i class="fa-solid fa-eye" style="color:#aaa;"></i>';
    };

    container.append(passwordInput, toggleButton);
    return container;
  }

  /**
   * Crée le bouton de soumission
   * @private
   * @returns {HTMLElement}
   */
  createSubmitButton() {
    return HTMLBuilder.build("input", {
      type: "submit",
      value: "Se connecter",
      style:
        "padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.3s;",
    });
  }

  /**
   * Crée le message de sécurité
   * @private
   * @returns {HTMLElement}
   */
  createSecurityMessage() {
    return HTMLBuilder.build("p", {
      innerText: "🔒 Connexion sécurisée",
      style:
        "color: #666; font-size: 0.8em; text-align: center; margin: 10px 0;",
    });
  }

  /**
   * Crée le lien "Mot de passe oublié"
   * @private
   * @returns {HTMLElement}
   */
  createForgotPasswordLink() {
    const link = HTMLBuilder.build("a", {
      innerText: "Mot de passe oublié ?",
      href: "#",
      style:
        "color: #007bff; font-size: 0.9em; text-align: center; text-decoration: none; margin: 5px 0;",
    });

    link.onclick = (e) => {
      e.preventDefault();
      this.openForgotPassword();
    };

    return link;
  }

  /**
   * Crée le bouton pour aller vers l'inscription
   * @private
   * @returns {HTMLElement}
   */
  createRegisterButton() {
    const registerButton = HTMLBuilder.build("button", {
      innerText: "S'inscrire >",
      style:
        "background: none; color: rgb(86, 86, 86); margin-top: 10px; border: none; cursor: pointer; font-size: 0.95em;",
      type: "button",
    });

    registerButton.onclick = () => {
      this.openRegister();
    };

    return registerButton;
  }

  /**
   * Valide le format de l'email
   * @private
   * @param {HTMLElement} emailInput
   * @returns {boolean}
   */
  validateEmail(emailInput) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(emailInput.value);

    if (emailInput.value && !isValid) {
      emailInput.style.borderColor = "red";
      return false;
    } else {
      emailInput.style.borderColor = "#ccc";
      return true;
    }
  }

  /**
   * Valide les entrées du formulaire
   * @private
   * @param {string} email
   * @param {string} password
   * @param {HTMLElement} errorMsg
   * @returns {boolean}
   */
  validateInputs(email, password, errorMsg) {
    // Vérifier si vide
    if (!email || !password) {
      this.showError(errorMsg, "Tous les champs sont requis");
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError(errorMsg, "Format d'email invalide");
      return false;
    }

    // Validation longueur email
    if (email.length > 255) {
      this.showError(errorMsg, "Email trop long");
      return false;
    }

    // Validation mot de passe
    if (password.length < 8) {
      this.showError(
        errorMsg,
        "Le mot de passe doit contenir au moins 8 caractères"
      );
      return false;
    }

    if (password.length > 128) {
      this.showError(errorMsg, "Mot de passe trop long");
      return false;
    }

    // Caractères suspects (protection basique injection)
    const dangerousPattern = /[<>\"'`]/;
    if (dangerousPattern.test(email)) {
      this.showError(errorMsg, "Caractères non autorisés dans l'email");
      return false;
    }

    return true;
  }

  /**
   * Vérifie le rate limiting
   * @private
   * @param {HTMLElement} errorMsg
   * @param {HTMLElement} submitButton
   * @returns {boolean}
   */
  checkRateLimit(errorMsg, submitButton) {
    const lockoutData = this.getLockoutData();

    if (lockoutData && lockoutData.endTime > Date.now()) {
      const remainingMs = lockoutData.endTime - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

      this.showError(
        errorMsg,
        `🔒 Trop de tentatives échouées. Veuillez réessayer dans ${remainingMinutes} minute(s)`
      );

      submitButton.disabled = true;
      submitButton.style.opacity = "0.5";
      submitButton.style.cursor = "not-allowed";

      this.lockoutEndTime = lockoutData.endTime;
      this.startLockoutTimer(submitButton, errorMsg);

      return false;
    }

    // Réinitialiser si le délai est passé
    if (lockoutData && lockoutData.endTime <= Date.now()) {
      this.clearLockout();
    }

    return true;
  }

  /**
   * Démarre le timer de verrouillage
   * @private
   * @param {HTMLElement} submitButton
   * @param {HTMLElement} errorMsg
   */
  startLockoutTimer(submitButton, errorMsg) {
    const timer = setInterval(() => {
      if (Date.now() >= this.lockoutEndTime) {
        clearInterval(timer);
        this.clearLockout();

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.style.opacity = "1";
          submitButton.style.cursor = "pointer";
        }

        if (errorMsg) {
          errorMsg.style.display = "none";
        }
      } else {
        const remainingMs = this.lockoutEndTime - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

        if (errorMsg) {
          this.showError(
            errorMsg,
            `🔒 Trop de tentatives échouées. Veuillez réessayer dans ${remainingMinutes} minute(s)`
          );
        }
      }
    }, 1000);
  }

  /**
   * Gère la tentative de connexion
   * @private
   * @param {string} email
   * @param {string} password
   * @param {HTMLElement} errorMsg
   * @param {HTMLElement} submitButton
   * @param {HTMLElement} attemptsIndicator
   */
  async handleLogin(
    email,
    password,
    errorMsg,
    submitButton,
    attemptsIndicator
  ) {
    try {
      // Masquer les messages précédents
      errorMsg.style.display = "none";
      attemptsIndicator.style.display = "none";

      // Nettoyage des entrées
      email = email.trim().toLowerCase();
      password = password.trim();

      // Vérifier le rate limiting
      if (!this.checkRateLimit(errorMsg, submitButton)) {
        return;
      }

      // Validation des entrées
      if (!this.validateInputs(email, password, errorMsg)) {
        return;
      }

      // Désactiver le bouton pendant le traitement
      submitButton.disabled = true;
      submitButton.value = "Connexion en cours...";
      submitButton.style.opacity = "0.7";

      // Appel API
      const result = await ApiService.login(email, password);

      if (result.success) {
        // Réinitialiser les tentatives
        this.clearLockout();

        // Message de succès
        this.showSuccess(errorMsg, "✓ Connexion réussie !");

        // Fermer la fenêtre après un court délai
        setTimeout(async () => {
          this.delete();

          // Charger le profil utilisateur
          const user = await this.loadUserProfile();

          // Appeler le callback si défini
          if (this.onLoginSuccess) {
            this.onLoginSuccess(user);
          }
        }, 500);
      } else {
        this.handleFailedLogin(errorMsg, attemptsIndicator, result.error);
        submitButton.disabled = false;
        submitButton.value = "Se connecter";
        submitButton.style.opacity = "1";
      }
    } catch (error) {
      this.handleFailedLogin(errorMsg, attemptsIndicator, error.message);
      submitButton.disabled = false;
      submitButton.value = "Se connecter";
      submitButton.style.opacity = "1";
    }
  }

  /**
   * Gère les tentatives échouées
   * @private
   * @param {HTMLElement} errorMsg
   * @param {HTMLElement} attemptsIndicator
   * @param {string} message
   */
  handleFailedLogin(errorMsg, attemptsIndicator, message) {
    this.failedAttempts++;
    this.recordFailedAttempt();

    const maxAttempts = 5;
    const remainingAttempts = maxAttempts - this.failedAttempts;

    // Message d'erreur générique pour ne pas révéler si l'email existe
    this.showError(errorMsg, message || "Email ou mot de passe incorrect");

    // Afficher l'indicateur de tentatives
    if (this.failedAttempts >= 3 && remainingAttempts > 0) {
      attemptsIndicator.innerText = `⚠️ ${remainingAttempts} tentative(s) restante(s)`;
      attemptsIndicator.style.display = "block";
    }

    // Verrouiller après 5 tentatives
    if (this.failedAttempts >= maxAttempts) {
      this.lockAccount();
    }
  }

  /**
   * Verrouille le compte temporairement
   * @private
   */
  lockAccount() {
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.lockoutEndTime = Date.now() + lockoutDuration;

    sessionStorage.setItem(
      "login_lockout",
      JSON.stringify({
        endTime: this.lockoutEndTime,
        attempts: this.failedAttempts,
      })
    );

    // Recharger le formulaire pour appliquer le verrouillage
    this.element.innerHTML = "";
    this.initializeLogin();
  }

  /**
   * Enregistre une tentative échouée
   * @private
   */
  recordFailedAttempt() {
    const lockoutData = this.getLockoutData() || { endTime: 0, attempts: 0 };

    sessionStorage.setItem(
      "login_lockout",
      JSON.stringify({
        endTime: lockoutData.endTime,
        attempts: this.failedAttempts,
      })
    );
  }

  /**
   * Récupère les données de verrouillage
   * @private
   * @returns {Object|null}
   */
  getLockoutData() {
    const data = sessionStorage.getItem("login_lockout");
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      this.failedAttempts = parsed.attempts || 0;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Efface le verrouillage
   * @private
   */
  clearLockout() {
    this.failedAttempts = 0;
    this.lockoutEndTime = null;
    sessionStorage.removeItem("login_lockout");
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
      console.error("Erreur de récupération du profil:", error);
      return { username: "Utilisateur" }; // Fallback
    }
  }

  /**
   * Affiche un message d'erreur
   * @private
   * @param {HTMLElement} errorMsg
   * @param {string} message
   */
  showError(errorMsg, message) {
    errorMsg.innerText = message;
    errorMsg.style.color = "red";
    errorMsg.style.display = "block";
  }

  /**
   * Affiche un message de succès
   * @private
   * @param {HTMLElement} errorMsg
   * @param {string} message
   */
  showSuccess(errorMsg, message) {
    errorMsg.innerText = message;
    errorMsg.style.color = "green";
    errorMsg.style.display = "block";
  }

  /**
   * Ouvre la fenêtre d'inscription
   * @private
   */
  openRegister() {
    this.delete();
    const registerWindow = new Register();

    // Transférer le callback de succès
    registerWindow.onLoginSuccess = this.onLoginSuccess;
  }

  /**
   * Ouvre la fenêtre "Mot de passe oublié"
   * @private
   */
  openForgotPassword() {
    // À implémenter selon vos besoins
    alert("Fonctionnalité 'Mot de passe oublié' à venir");
    // Exemple: new ForgotPassword();
  }
}

// Export pour utilisation globale
window.Login = Login;
