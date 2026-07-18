import * as api from "./api.js";

function login() {
    let form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        let oldError = document.getElementById("loginError");
        if (oldError) {
            oldError.textContent = "";
        }

        let data = {
            username: form.logInUsername.value,
            password: form.logInPassword.value,
        };

        if (data.username.length === 0 || data.password.length === 0) {
            oldError.textContent = "Fyll i både användarnamn och lösenord";
            return;
        }

        try {
            await api.postRequest("/api/login", data, true);
            oldError.textContent = ``;
            window.location.href = "/home";

        } catch (error) {
            oldError.textContent = "Fel användarnamn eller lösenord";

            form.logInPassword.insertAdjacentElement("afterend", errorSpan);
        }
    });
}

async function createUser() {
    let registerButton = document.getElementById("createUser");
    registerButton.addEventListener("click", async function (e) {
        window.location.href = "/register";
    })
}

createUser();
login();