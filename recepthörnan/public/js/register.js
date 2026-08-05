import * as api from "./api.js";
console.log("register.js laddades");

async function createUser() {
    let form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        let oldError = document.getElementById("signUpError");
        if (oldError) {
            oldError.textContent = "";
        }
        // Hämtar valda intressen
        let selectedInterests = [];
        let interestInputs = document.querySelectorAll(
            'input[name="interests"]:checked'
        );
        for (let input of interestInputs) {
            selectedInterests.push(input.value);
        }
        let data = {
            email: form.signUpMail.value,
            username: form.signUpUsername.value,
            password: form.signUpPassword.value,
            repeatPassword: form.signUpRepeatPassword.value,
            level: form.level.value,
            interests: selectedInterests
        };
        if (data.password !== data.repeatPassword) {
            oldError.textContent = "Lösenorden matchar inte";
            return;
        }
        if (!data.level) {
            oldError.textContent = "Välj hur van du är vid köket.";
            return;
        }
        if (data.interests.length === 0) {
            oldError.textContent = "Välj minst ett intresse.";
            return;
        }
        try {
            console.log(data);
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
        e.preventDefault();
        window.location.href = "/login";
    });

}

login();
createUser();