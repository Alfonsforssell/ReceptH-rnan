import * as api from "./api.js";

let recipes = [];
let myRecipes = [];
let users = [];
let currentUser;

async function getData() {
    recipes = await api.getRequest("/api/recipes", true);
    myRecipes = await api.getRequest("/api/profile/recipes", true);
}

async function getUser() {
    currentUser = await api.getRequest("/api/profile", true);
    createUserInfo(currentUser);
    generateForm(currentUser);
}

function getRecipeAmount() {
    return myRecipes.length;
}

function getFavAmount(user) {
    return user.favourites.length;
}

function createUserInfo(user) {
    let userInfo = document.getElementById("userInfo");
    let firstLetter = user.username.charAt(0).toUpperCase();

    userInfo.innerHTML = `
    <p>${firstLetter}</p>
            <div id="info">
                <h1 id="one">${user.username.toUpperCase()}</h1 >
                <h2 id="two">${user.email}</h2>
                <h2 id="three">${user.createdAt}</h2>
                <h2 id="four"><img src="assets/icons/recipe.png" alt="">${getRecipeAmount()}</h2>
                <h2 id="five"><img src="assets/icons/heart.png" alt="">${getFavAmount(user)}</h2>
            </div >
    `;
}

function generateForm(user) {
    let form = document.querySelector("form");
    form.elements.username.value = user.username;
    form.elements.mail.value = user.email;
}

function updateUserInfo() {
    let usernameError = document.getElementById("usernameError");
    let mailError = document.getElementById("mailError");
    let passwordError = document.getElementById("passwordError");

    let button = document.getElementById("updateProfile");
    button.addEventListener("click", async function (e) {
        e.preventDefault();
        usernameError.textContent = "";
        mailError.textContent = "";
        passwordError.textContent = "";
        let form = document.querySelector("form");

        let body = {
            username: form.elements.username.value,
            email: form.elements.mail.value
        }

        if (form.elements.password.value !== "" || form.elements.repeatPassword.value !== "") {
            if (form.elements.password.value !== form.elements.repeatPassword.value) {
                passwordError.textContent = "Lösenorden matchar inte.";
                return;
            }
            body.password = form.elements.password.value;
        }
        else {
            body.password = currentUser.password;
        }
        try {
            await api.patchRequest("/api/profile", body, true);
            alert("Profilen har uppdaterats!")
            await getData();
            await getUser();
            form.elements.password.value = "";
            form.elements.repeatPassword.value = "";
        }
        catch (error) {

            if (error.message.includes("Username already exists")) {
                usernameError.textContent = "Användarnamnet används redan.";
            }
            else if (error.message.includes("Email already exists")) {
                mailError.textContent = "Mailadressen används redan.";
            }
            else if (error.message.includes("Repeated password")) {
                passwordError.textContent = "Lösenorden matchar inte.";
            }
            else {
                usernameError.textContent = error.message;
            }

        }
    })
}

function logout() {
    let button = document.getElementById("logout")
    button.addEventListener("click", async function (e) {
        e.preventDefault();
        try {
            await api.postRequest("/api/logout", {}, true);
            window.location.href = "/login";
        }
        catch (error) {
            console.log(error);
        }
    })
}

async function init() {
    try {
        await getData();
        await getUser();
    } catch (error) {
        window.location.href = "/login";
        return;
    }

    updateUserInfo();
    logout();
}

init();
