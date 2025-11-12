//import { HTMLbuilder } from "./components/HTMLbuilder.js";

function ondoubleclick(element, func) {
    let lastClick = Date.now();
    const threshold = 200

    element.onclick = () => {
        if (Date.now() - lastClick < threshold) {
            func()
            lastClick = Date.now() - threshold;
        } else {
            lastClick = Date.now();
        }
    }
}

class Window {
    static States = {}
    #Window;
    #Title;

    constructor(height, width, closeable, title = Math.random().toString()) {
        if (Window.States[title]){
            return
        }

        this.#Window = HTMLbuilder.build("div", {
            className: `window ${closeable ? "closeable" : ""}`,
            style: `height: ${height}vw; width: ${width}vw;`
        });

        this.#Title = title
        Window.States[title] = true;

        const nTopBar = HTMLbuilder.build("div", { className: "topbar" });
        nTopBar.appendChild(HTMLbuilder.build("img", { src: "/public/assets/left_bar_px.png" }));
        nTopBar.appendChild(HTMLbuilder.build("img", { className: "mid", src: "/public/assets/mid_bar_px.png" }));
        nTopBar.appendChild(HTMLbuilder.build("img", { src: "/public/assets/right_bar_px.png" }));

        const label = HTMLbuilder.build("label", { className: "app-name", innerText: title });
        nTopBar.appendChild(label);

        if (closeable) {
            const closeButton = HTMLbuilder.build("img", { className: "app-close", src: "/public/assets/close_px.png", draggable: false });
            closeButton.addEventListener('click', () => this.delete());
            nTopBar.appendChild(closeButton);
        }

        const nContent = HTMLbuilder.build("div", { className: "content" });

        const leftSection = HTMLbuilder.build("div", {});
        leftSection.appendChild(HTMLbuilder.build("img", { src: "/public/assets/left_content_px.png" }));
        leftSection.appendChild(HTMLbuilder.build("img", { src: "/public/assets/left_content_bottom_px.png" }));

        const holder = HTMLbuilder.build("div", { className: "holder" });
        holder.appendChild(HTMLbuilder.build("div", {}));
        holder.appendChild(HTMLbuilder.build("img", { src: "/public/assets/mid_content_bottom_px.png" }));

        const rightSection = HTMLbuilder.build("div", {});
        rightSection.appendChild(HTMLbuilder.build("img", { src: "/public/assets/right_content_px.png" }));
        rightSection.appendChild(HTMLbuilder.build("img", { src: "/public/assets/right_content_bottom_px.png" }));

        nContent.appendChild(leftSection);
        nContent.appendChild(holder);
        nContent.appendChild(rightSection);

        this.#Window.appendChild(nTopBar);
        this.#Window.appendChild(nContent);

        document.body.querySelector("main > .windows").appendChild(this.#Window);
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
        const label = this.#Window.querySelector(".topbar .app-name");
        if (label) {
            label.innerText = name;
        }
    }

    append(element) {
        this.#Window.querySelector(".holder > div").appendChild(element);
    }
}


class Menu extends Window {
    constructor() {
        super(50, 50, true, "Menu");

        super.append(HTMLbuilder.build("h1", { innerText: "Bienvenue sur HackOS", style: "color: #b2533f;" }))
        super.append(HTMLbuilder.build("p", { innerText: "Apprenez à vous prémunir contre les menaces liées à la cybersécurité!" }))

        const login = HTMLbuilder.build("button", { innerText: "Se connecter ou s'inscrire", style: "background: #3e9587; color: white" })
        super.append(login)

        login.onclick = () => {
            const login = new Login();
            login.submit = (username, password) => {
                login.delete();
                console.log(username, password);
            }
        }
    }
}

class Login extends Window {
    constructor() {
        super(20, 20, true, "Se connecter");
        const form = HTMLbuilder.build("form", {
            style: "display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center"
        });

        const username = HTMLbuilder.build("input", { type: "text", placeholder: "Nom d'utilisateur" });
        const password = HTMLbuilder.build("input", { type: "password", placeholder: "Mot de passe" });
        const submit = HTMLbuilder.build("input", { type: "submit", value: "Se connecter" });

        const errorMsg = HTMLbuilder.build("p", { style: "color: red; display: none;" });

        form.onsubmit = async (e) => {
            e.preventDefault();
            errorMsg.style.display = "none";

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: username.value, password: password.value })
                });

                const data = await response.json();
                if (data.success) {
                    this.delete();
                    alert("Connexion réussie !");
                    this.loadProfile();
                } else {
                    errorMsg.innerText = data.error;
                    errorMsg.style.display = "block";
                }
            } catch (err) {
                console.error("Erreur lors de la connexion :", err);
                errorMsg.innerText = "Erreur serveur.";
                errorMsg.style.display = "block";
            }
        };

        // Création du bouton "S'inscrire"
        const registerButton = HTMLbuilder.build("button", {
            innerText: "S'inscrire >",
            style: "background: none; color: white; margin-top: 10px; filter : none; height: 2vw; color: rgb(86, 86, 86);"
        });

        // Ajout d'un événement au bouton "S'inscrire"
        registerButton.onclick = () => {
            this.delete(); // delete login window
            const registerWindow = new Register();
        };

        form.append(username, password, submit, errorMsg, registerButton);
        super.append(form);
    }

    async loadProfile() {
        try {
            const response = await fetch("/profile");
            if (!response.ok) throw new Error("Non autorisé");

            const user = await response.json();
            console.log("Utilisateur connecté :", user);
            alert(`Bienvenue, ${user.username} !`);
        } catch (err) {
            console.error("Erreur de récupération du profil :", err);
        }
    }
}

class Register extends Window {
    constructor() {
        super(20, 20, true, "S'inscrire");
        const form = HTMLbuilder.build("form", {
            style: "display:flex; width: 100%; height: 100%; overflow: hidden; flex-direction: column; justify-content: center"
        });

        const mail = HTMLbuilder.build("input", { type: "text", placeholder: "Mail" });
        const username = HTMLbuilder.build("input", { type: "text", placeholder: "Nom d'utilisateur" });
        const password = HTMLbuilder.build("input", { type: "password", placeholder: "Mot de passe" });
        const submit = HTMLbuilder.build("input", { type: "submit", value: "S'inscrire" });

        const errorMsg = HTMLbuilder.build("p", { style: "color: red; display: none;" });

        form.onsubmit = async (e) => {
            e.preventDefault();
            errorMsg.style.display = "none";

            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: mail.value, username: username.value, password: password.value })
                });

                // First check if the response is OK (status 200-299)
                if (!response.ok) {
                    // Try to get error text if not JSON
                    const text = await response.text();
                    try {
                        // If it's JSON, use that
                        const data = JSON.parse(text);
                        errorMsg.innerText = data.error || "Erreur inconnue";
                    } catch {
                        // If not JSON, show the raw text or generic message
                        errorMsg.innerText = text || `Erreur serveur (${response.status})`;
                    }
                    errorMsg.style.display = "block";
                    return;
                }

                // If response is OK, parse as JSON
                const data = await response.json();
                if (data.success) {
                    this.delete();
                    alert("Inscription réussie !");
                } else {
                    errorMsg.innerText = data.error || "Erreur inconnue";
                    errorMsg.style.display = "block";
                }
            } catch (err) {
                console.error("Erreur lors de l'inscription :", err);
                errorMsg.innerText = "Erreur de connexion au serveur";
                errorMsg.style.display = "block";
            }
        };

        const loginButton = HTMLbuilder.build("button", {
            innerText: "< Retour",
            style: "color:rgb(86, 86, 86); margin-top: 5px; background:none; filter: none; height:2vw;"
        });

        loginButton.onclick = () => {
            this.delete(); // delete register window
            const loginWindow = new Login();
        };

        form.append(mail, username, password, submit, errorMsg, loginButton);
        super.append(form);
    }
}

class LoadingBar extends Window {
    constructor(Title) {
        super(10, 20, false, Title);

        const wrapper = HTMLbuilder.build("div", { style: "display:flex;width: 100%; height : 100%; justify-content: center; align-items: center;" })
        const loadbar_back = HTMLbuilder.build("div", { style: "display:flex; width: 80%; height : 20%; background: black; overflow: hidden" })
        const loadbar = HTMLbuilder.build("div", { style: "display:flex; width: 0%; height : 100%; background: green; overflow: hidden" })

        let progress = 0;

        const interval = setInterval(() => {
            progress += 10;
            loadbar.style.width = `${progress}%`;

            if (progress > 100) {
                clearInterval(interval);
                this.loaded();
            }
        }, 100)


        loadbar_back.append(loadbar);
        wrapper.append(loadbar_back);
        super.append(wrapper);
    }

    loaded() {
        throw new Error("No loaded handler");
    }
}

document.body.onload = () => {
    const menubtn = document.querySelector("#menubtn")
    ondoubleclick(menubtn, () => {
        const m = new Menu()
    })
}

// drag and drop

document.querySelectorAll(".apps .app").forEach(app => {
    app.draggable = true; // Assurez-vous que l'élément est bien draggable

    app.addEventListener("dragstart", (e) => {
        app.classList.add("dragging");
        e.dataTransfer.setData("text/plain", null); // Pour Firefox
    });

    app.addEventListener("dragend", () => {
        app.classList.remove("dragging");
    });
});


const appsContainer = document.querySelector(".apps");

appsContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(appsContainer, e.clientX);
    if (afterElement == null) {
        appsContainer.appendChild(dragging);
    } else {
        appsContainer.insertBefore(dragging, afterElement);
    }
});

// Fonction magique : trouve l'élément le plus proche après la souris
function getDragAfterElement(container, x) {
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

// Add a new app

document.querySelectorAll('.window').forEach(win => {
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
