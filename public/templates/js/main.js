class HTMLbuilder {
  static build(type, properties) {
    const element = document.createElement(type);
    for (const property in properties) {
      element[property] = properties[property];
    }
    return element;
  }

  static makeDraggable(element) {
    let isDragging = false,
      offsetX,
      offsetY;
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
//import { HTMLbuilder } from "./components/HTMLbuilder.js";

function ondoubleclick(element, func) {
  let lastClick = Date.now();
  const threshold = 200;

  element.onclick = () => {
    if (Date.now() - lastClick < threshold) {
      func();
      lastClick = Date.now() - threshold;
    } else {
      lastClick = Date.now();
    }
  };
}

class Window {
  static States = {};
  #Window;
  #Title;

  constructor(height, width, closeable, title = Math.random().toString()) {
    if (Window.States[title]) {
      return;
    }

    this.#Window = HTMLbuilder.build('div', {
      className: `window ${closeable ? 'closeable' : ''}`,
      style: `height: ${height}vw; width: ${width}vw;`,
    });

    this.#Title = title;
    Window.States[title] = true;

    const nTopBar = HTMLbuilder.build('div', { className: 'topbar' });
    nTopBar.appendChild(
      HTMLbuilder.build('img', { src: '/public/assets/left_bar_px.png' }),
    );
    nTopBar.appendChild(
      HTMLbuilder.build('img', {
        className: 'mid',
        src: '/public/assets/mid_bar_px.png',
      }),
    );
    nTopBar.appendChild(
      HTMLbuilder.build('img', { src: '/public/assets/right_bar_px.png' }),
    );

    const label = HTMLbuilder.build('label', {
      className: 'app-name',
      innerText: title,
    });
    nTopBar.appendChild(label);

    if (closeable) {
      const closeButton = HTMLbuilder.build('img', {
        className: 'app-close',
        src: '/public/assets/close_px.png',
        draggable: false,
      });
      closeButton.addEventListener('click', () => this.delete());
      nTopBar.appendChild(closeButton);
    }

    const nContent = HTMLbuilder.build('div', { className: 'content' });

    const leftSection = HTMLbuilder.build('div', {});
    leftSection.appendChild(
      HTMLbuilder.build('img', { src: '/public/assets/left_content_px.png' }),
    );
    leftSection.appendChild(
      HTMLbuilder.build('img', {
        src: '/public/assets/left_content_bottom_px.png',
      }),
    );

    const holder = HTMLbuilder.build('div', { className: 'holder' });
    holder.appendChild(HTMLbuilder.build('div', {}));
    holder.appendChild(
      HTMLbuilder.build('img', {
        src: '/public/assets/mid_content_bottom_px.png',
      }),
    );

    const rightSection = HTMLbuilder.build('div', {});
    rightSection.appendChild(
      HTMLbuilder.build('img', { src: '/public/assets/right_content_px.png' }),
    );
    rightSection.appendChild(
      HTMLbuilder.build('img', {
        src: '/public/assets/right_content_bottom_px.png',
      }),
    );

    nContent.appendChild(leftSection);
    nContent.appendChild(holder);
    nContent.appendChild(rightSection);

    this.#Window.appendChild(nTopBar);
    this.#Window.appendChild(nContent);

    document.body.querySelector('main > .windows').appendChild(this.#Window);
    HTMLbuilder.makeDraggable(this.#Window);
  }

  delete() {
    Window.States[this.#Title] = false;
    this.#Window.remove();
  }

  resize(height, width) {
    this.#Window.style.height = `${height}vw`;
    this.#Window.style.width = `${width}vw`;
  }

  rename(name) {
    const label = this.#Window.querySelector('.topbar .app-name');
    if (label) {
      label.innerText = name;
    }
  }

  append(element) {
    this.#Window.querySelector('.holder > div').appendChild(element);
  }
}

class Menu extends Window {
  constructor() {
    super(30, 50, true, 'Menu');
    // Store reference to this Menu instance globally so it can be updated
    window.globalMenuInstance = this;
    this.render();
  }

  render() {
    // Clear content
    const holderContent = this._getHolderContent();
    if (holderContent) {
      holderContent.innerHTML = '';
    }

    // Add title and description
    const h1 = HTMLbuilder.build('h1', {
      innerText: 'Bienvenue sur HackOS',
      style: 'color: #b2533f;',
    });
    const p = HTMLbuilder.build('p', {
      innerText:
        'Apprenez à vous prémunir contre les menaces liées à la cybersécurité!',
    });

    // Check if user is logged in
    const isLoggedIn = this._isUserLoggedIn();

    if (isLoggedIn) {
      // Show logout button
      const logout = HTMLbuilder.build('button', {
        innerText: 'Se déconnecter',
        style: 'background: #d9534f; color: white',
      });
      logout.onclick = async () => {
        try {
          // Use ApiService to logout (clears token)
          await window.ApiService.logout();
          // Reset user pseudo in nav
          const userPseudo = document.querySelector('#userPseudo');
          if (userPseudo) userPseudo.innerText = 'Utilisateur';
          // Refresh menu to show login button again
          if (window.globalMenuInstance && window.globalMenuInstance.render) {
            window.globalMenuInstance.render();
          }
        } catch (err) {
          console.error('Erreur lors de la déconnexion :', err);
        }
      };

      if (holderContent) {
        holderContent.appendChild(h1);
        holderContent.appendChild(p);
        holderContent.appendChild(logout);
      }
    } else {
      // Show login/register button
      const login = HTMLbuilder.build('button', {
        innerText: "Se connecter ou s'inscrire",
        style: 'background: #3e9587; color: white',
      });
      login.onclick = () => {
        const loginWindow = new Login();
        // After successful login, refresh menu
        loginWindow.onLoginSuccess = () => {
          if (window.globalMenuInstance && window.globalMenuInstance.render) {
            window.globalMenuInstance.render();
          }
        };
      };

      if (holderContent) {
        holderContent.appendChild(h1);
        holderContent.appendChild(p);
        holderContent.appendChild(login);
      }
    }
  }

  _getHolderContent() {
    return (
      document.querySelector('.window.Menu .holder > div') ||
      document.querySelector('main > .windows .window:last-child .holder > div')
    );
  }

  _isUserLoggedIn() {
    // Check if user pseudo is displayed in nav (user is logged in)
    const userPseudo = document.querySelector('#userPseudo');
    return userPseudo && userPseudo.innerText !== 'Visiteur';
  }
}

class Login extends Window {
  constructor() {
    super(25, 20, true, 'Se connecter');
    const form = HTMLbuilder.build('form', {
      style:
        'display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center',
    });

    const username = HTMLbuilder.build('input', {
      type: 'text',
      placeholder: "Nom d'utilisateur",
    });

    // Champ mot de passe avec bouton afficher/masquer
    const passwordContainer = HTMLbuilder.build('div', {
      style: 'position: relative; width: 100%;',
    });
    const password = HTMLbuilder.build('input', {
      type: 'password',
      placeholder: 'Mot de passe',
      style: 'padding-right: 40px; box-sizing: border-box; width: 100%;',
    });
    const togglePassword = HTMLbuilder.build('button', {
      type: 'button',
      innerHTML: '<i class="fa-solid fa-eye" style="color:#aaa;"></i>',
      style:
        'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1em; outline: none; box-shadow: none; filter: none;',
    });
    togglePassword.onclick = () => {
      const isHidden = password.type === 'password';
      password.type = isHidden ? 'text' : 'password';
      togglePassword.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash" style="color:#aaa;"></i>'
        : '<i class="fa-solid fa-eye" style="color:#aaa;"></i>';
    };
    passwordContainer.append(password, togglePassword);
    const submit = HTMLbuilder.build('input', {
      type: 'submit',
      value: 'Se connecter',
    });

    const errorMsg = HTMLbuilder.build('p', {
      style:
        'color: #ff6b6b; display: none; margin: 10px 0; padding: 8px; background: rgba(255, 107, 107, 0.1); border-radius: 4px; font-size: 0.9em; text-align: center; white-space: pre-line; border: 1px solid rgba(255, 107, 107, 0.3);',
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      try {
        // Use centralized ApiService so tokens are stored correctly
        const data = await window.ApiService.login(
          username.value,
          password.value,
        );

        if (data && data.success) {
          this.delete(); // Fermer la fenêtre de login d'abord
          this.loadProfile(); // Charger le profil

          if (window.Swal) {
            Swal.fire({
              icon: 'success',
              title: 'Connexion réussie',
              text: 'Bienvenue sur Hackemon !',
              confirmButtonColor: '#3085d6',
              timer: 3000,
              showConfirmButton: false,
            });
          }
        } else {
          // Normalize error message
          let errorMessage = '🚨 Erreur de connexion';
          if (data) {
            if (data.errors && Array.isArray(data.errors))
              errorMessage = data.errors[0].message;
            else if (data.message) errorMessage = data.message;
            else if (data.error) errorMessage = data.error;
          }
          errorMsg.innerText = errorMessage;
          errorMsg.className = 'error-message';
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        console.error('Erreur lors de la connexion :', err);
        errorMsg.innerText =
          err.message || '🌐 Impossible de contacter le serveur';
        errorMsg.className = 'error-message';
        errorMsg.style.display = 'block';
      }
    };

    // Création du bouton "S'inscrire"
    const registerButton = HTMLbuilder.build('button', {
      innerText: "S'inscrire >",
      style:
        'background: none; color: white; margin-top: 10px; filter : none; height: 2vw; color: rgb(86, 86, 86);',
    });

    // Ajout d'un événement au bouton "S'inscrire"
    registerButton.onclick = () => {
      this.delete(); // delete login window
      const registerWindow = new Register();
    };

    form.append(username, passwordContainer, submit, errorMsg, registerButton);
    super.append(form);
  }

  async loadProfile() {
    try {
      const data = await window.ApiService.get('/profile', true);
      const user = data.user || data;
      console.log('Utilisateur connecté :', user);
      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: `Bienvenue, ${user.username} !`,
          confirmButtonColor: '#3085d6',
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        alert(`Bienvenue, ${user.username} !`);
      }

      // Update user profile in nav
      if (window.UserProfile) {
        window.UserProfile.set(user);
      }

      // Refresh menu if it exists
      if (window.globalMenuInstance && window.globalMenuInstance.render) {
        window.globalMenuInstance.render();
      }
    } catch (err) {
      console.error('Erreur de récupération du profil :', err);
    }
  }
}

class Register extends Window {
  constructor() {
    super(30, 20, true, "S'inscrire");
    const form = HTMLbuilder.build('form', {
      style:
        'display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center',
    });

    const mail = HTMLbuilder.build('input', {
      type: 'text',
      placeholder: 'Mail',
    });
    const username = HTMLbuilder.build('input', {
      type: 'text',
      placeholder: "Nom d'utilisateur",
    });

    // Champ mot de passe avec bouton afficher/masquer
    const passwordContainer = HTMLbuilder.build('div', {
      style: 'position: relative; width: 100%;',
    });
    const password = HTMLbuilder.build('input', {
      type: 'password',
      placeholder: 'Mot de passe',
      style: 'padding-right: 40px; box-sizing: border-box; width: 100%;',
    });
    const togglePassword = HTMLbuilder.build('button', {
      type: 'button',
      innerHTML: '<i class="fa-solid fa-eye" style="color:#aaa;"></i>',
      style:
        'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1em; outline: none; box-shadow: none; filter: none;',
    });
    togglePassword.onclick = () => {
      const isHidden = password.type === 'password';
      password.type = isHidden ? 'text' : 'password';
      togglePassword.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash" style="color:#aaa;"></i>'
        : '<i class="fa-solid fa-eye" style="color:#aaa;"></i>';
    };
    passwordContainer.append(password, togglePassword);
    const submit = HTMLbuilder.build('input', {
      type: 'submit',
      value: "S'inscrire",
    });

    const errorMsg = HTMLbuilder.build('p', {
      style:
        'color: #ff6b6b; display: none; margin: 10px 0; padding: 8px; background: rgba(255, 107, 107, 0.1); border-radius: 4px; font-size: 0.9em; text-align: center; white-space: pre-line; border: 1px solid rgba(255, 107, 107, 0.3);',
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mail.value,
            username: username.value,
            password: password.value,
          }),
        });

        // Gestion améliorée des réponses d'erreur
        if (!response.ok) {
          const text = await response.text();
          let errorMessage = "🚨 Erreur d'inscription";

          try {
            const errorData = JSON.parse(text);

            // Nouvelle structure d'erreur avec validation
            if (errorData.errors && Array.isArray(errorData.errors)) {
              // Afficher toutes les erreurs ou juste la première selon la préférence
              if (errorData.errors.length === 1) {
                errorMessage = errorData.errors[0].message;
              } else {
                // Afficher plusieurs erreurs de manière propre
                errorMessage = errorData.errors
                  .map((err) => err.message)
                  .join('\n');
              }
            } else if (errorData.message) {
              // Message d'erreur simple
              errorMessage = errorData.message;
            } else if (errorData.error) {
              // Ancien format d'erreur
              errorMessage = errorData.error;
            }
          } catch {
            // Si ce n'est pas du JSON, utiliser le texte brut
            errorMessage = text || `🔌 Erreur serveur (${response.status})`;
          }

          errorMsg.innerText = errorMessage;
          errorMsg.className = 'error-message';
          errorMsg.style.display = 'block';
          return;
        }

        // Si response OK, analyser les données
        const data = await response.json();
        if (data.success) {
          this.delete();
          if (window.Swal) {
            Swal.fire({
              icon: 'success',
              title: 'Inscription réussie',
              text: 'Bienvenue sur Hackemon !',
              confirmButtonColor: '#3085d6',
              timer: 3000,
              showConfirmButton: false,
            });
          }
          // Optionnel : ouvrir automatiquement la fenêtre de connexion
          new Login();
        } else {
          // Fallback pour d'autres formats d'erreur
          let errorMessage = "🚨 Erreur d'inscription";

          if (data.errors && Array.isArray(data.errors)) {
            if (data.errors.length === 1) {
              errorMessage = data.errors[0].message;
            } else {
              errorMessage = data.errors.map((err) => err.message).join('\n');
            }
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else {
            errorMessage = "🤔 Une erreur inattendue s'est produite";
          }

          errorMsg.innerText = errorMessage;
          errorMsg.className = 'error-message';
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
        errorMsg.innerText = '🌐 Impossible de contacter le serveur';
        errorMsg.className = 'error-message';
        errorMsg.style.display = 'block';
      }
    };

    const loginButton = HTMLbuilder.build('button', {
      innerText: '< Retour',
      style:
        'color:rgb(86, 86, 86); margin-top: 5px; background:none; filter: none; height:2vw;',
    });

    loginButton.onclick = () => {
      this.delete(); // delete register window
      const loginWindow = new Login();
    };

    form.append(
      mail,
      username,
      passwordContainer,
      submit,
      errorMsg,
      loginButton,
    );
    super.append(form);
  }
}

class LoadingBar extends Window {
  constructor(Title) {
    super(10, 20, false, Title);

    const wrapper = HTMLbuilder.build('div', {
      style:
        'display:flex;width: 100%; height : 100%; justify-content: center; align-items: center;',
    });
    const loadbar_back = HTMLbuilder.build('div', {
      style:
        'display:flex; width: 80%; height : 20%; background: black; overflow: hidden',
    });
    const loadbar = HTMLbuilder.build('div', {
      style:
        'display:flex; width: 0%; height : 100%; background: green; overflow: hidden',
    });

    let progress = 0;

    const interval = setInterval(() => {
      progress += 10;
      loadbar.style.width = `${progress}%`;

      if (progress > 100) {
        clearInterval(interval);
        this.loaded();
      }
    }, 100);

    loadbar_back.append(loadbar);
    wrapper.append(loadbar_back);
    super.append(wrapper);
  }

  loaded() {
    throw new Error('No loaded handler');
  }
}

// drag and drop
document.querySelectorAll('.apps .app').forEach((app) => {
  app.draggable = true;

  app.addEventListener('dragstart', (e) => {
    app.classList.add('dragging');
    e.dataTransfer.setData('text/plain', null);
  });

  app.addEventListener('dragend', () => {
    app.classList.remove('dragging');
  });
});

const appsContainer = document.querySelector('.apps');

if (appsContainer) {
  appsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(appsContainer, e.clientX);
    if (afterElement == null) {
      appsContainer.appendChild(dragging);
    } else {
      appsContainer.insertBefore(dragging, afterElement);
    }
  });
}

function getDragAfterElement(container, x) {
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
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// Window drag handler
document.querySelectorAll('.window').forEach((win) => {
  const topbar = win.querySelector('.topbar');

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  topbar.addEventListener('mousedown', (e) => {
    isDragging = true;
    win.classList.add('dragging');

    const rect = win.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    win.style.zIndex = parseInt(Date.now() / 1000);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      win.classList.remove('dragging');
    }
  });
});

// Global reference to Menu instance for updates
let globalMenuInstance = null;

document.body.onload = () => {
  // Create the initial Menu instance on page load
  const initialMenu = new Menu();

  const menubtn = document.querySelector('#menubtn');
  ondoubleclick(menubtn, () => {
    // Toggle Menu visibility or create a new one if deleted
    if (!globalMenuInstance) {
      const m = new Menu();
    }
  });
};
