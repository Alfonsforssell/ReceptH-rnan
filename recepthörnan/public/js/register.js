import * as api from "./api.js";

async function createUser() {
    let form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        let oldError = document.getElementById("signUpError");
        if (oldError) {
            oldError.textContent = "";
        }

        let data = {
            email: form.signUpMail.value,
            username: form.signUpUsername.value,
            password: form.signUpPassword.value,
            repeatPassword: form.signUpRepeatPassword.value,
        };

        if (data.password !== data.repeatPassword) {
            oldError.textContent = "Lösenorden matchar inte";
            return;
        }

        try {
            await api.postRequest("/api/users", data);

            await api.postRequest("/api/login", {
                username: data.username,
                password: data.password
            }, true);

            window.location.href = "/home";

        } catch (error) {
            oldError.textContent = error.message;
        }
    });

}

function login() {
    let loginButton = document.querySelector("form a");
    loginButton.addEventListener("click", function (e) {
        window.location.href = "/login";
    })
}

login()
createUser();