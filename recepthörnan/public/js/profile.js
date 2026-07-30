import * as api from "./api.js";

let recipes = [];
let myRecipes = [];
let users = [];
let categories = [];
let countries = [];
let dietaries = [];
let currentUser;
let selectedRecipeId = null;

async function getData() {
    recipes = await api.getRequest("/api/recipes", true);
    myRecipes = await api.getRequest("/api/profile/recipes", true);
    categories = await api.getRequest("/api/categories");
    countries = await api.getRequest("/api/countries");
    dietaries = await api.getRequest("/api/dietaries");
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

function getDate(user) {
    let arr = user.createdAt.split("T");
    return arr[0];
}

function createUserInfo(user) {
    let userInfo = document.getElementById("userInfo");
    let firstLetter = user.username.charAt(0).toUpperCase();

    userInfo.innerHTML = `
    <p>${firstLetter}</p>
            <div id="info">
                <h1 id="one">${user.username.toUpperCase()}</h1 >
                <h2 id="two">${user.email}</h2>
                <h2 id="three">${getDate(user)}</h2>
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
            if (error.message.includes("Username")) {
                usernameError.textContent = "Användarnamnet används redan.";
            }
            else if (error.message.includes("Email")) {
                mailError.textContent = "Mailadressen används redan.";
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



function renderRecipes(filteredRecipes = myRecipes) {
    let recipeContainer = document.getElementById("recipeContainer");
    recipeContainer.innerHTML = "";

    for (let oneRecipe of filteredRecipes) {
        let div = document.createElement("div");

        div.dataset.recipeId = oneRecipe.id;

        div.innerHTML = `
        <div class="empty"></div>
        <div class="content">
                <h1>${oneRecipe.name}</h1>
                <p>${oneRecipe.description}</p>
                <div class="info">
                    <h2>${oneRecipe.time} min</h2>
                    <h2>${oneRecipe.category}</h2>
                    <h2>${oneRecipe.country}</h2>
                </div>
                <div class="diets"></div>
                <button class="edit">&bull;&bull;&bull;</button>
        </div>`;
        div.style.backgroundImage = `url(assets${oneRecipe.imageUrl})`

        for (let diet of dietaries) {
            if (oneRecipe.dietary.includes(diet)) {
                let diets = div.querySelector(".diets");
                let img = document.createElement("img");
                img.src = `assets/icons/${diet}.svg`;
                img.classList.add("icon");
                diets.appendChild(img);
            }
        }
        recipeContainer.appendChild(div);
        div.classList.add("card");

        div.addEventListener("click", function (e) {
            location.href = "/recipe/" + oneRecipe.id;
        })
    }
    if (recipeContainer.children.length === 0) {
        recipeContainer.innerHTML = `<p id="notFound">Hittade inga recept</p>`;
    }

}
function openPopup() {
    let buttons = document.querySelectorAll(".edit");

    for (let button of buttons) {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            selectedRecipeId = button.closest(".card").dataset.recipeId;
            document.getElementById("overlay").classList.add("show");
        });
    }
}

function editRecipe() {
    if (selectedRecipeId === null) {
        return;
    }
    window.location.href = "/edit/recipe/" + selectedRecipeId;
}

function showDeleteConfirmation() {
    document.getElementById("popupTitle").textContent = "Är du säker?";

    document.getElementById("contentButtons").innerHTML = `
        <button id="confirmDelete">Ta bort</button>
        <button id="cancelDelete">Avbryt</button>
    `;

    document.getElementById("confirmDelete").addEventListener("click", deleteRecipe);

    document.getElementById("cancelDelete").addEventListener("click", restorePopup);

}

function restorePopup() {
    document.getElementById("popupTitle").textContent = "Hantera recept";

    document.getElementById("contentButtons").innerHTML = `
        <button id="editRecipe">Redigera recept</button>
        <button id="deleteRecipe">Ta bort recept</button>
    `;

    document.getElementById("editRecipe").addEventListener("click", editRecipe);

    document.getElementById("deleteRecipe").addEventListener("click", showDeleteConfirmation);
}

async function deleteRecipe() {
    if (selectedRecipeId === null) {
        return;
    }

    try {
        await api.deleteRequest("/api/recipes/" + selectedRecipeId, true);
        document.querySelector(`[data-recipe-id="${selectedRecipeId}"]`).remove();
        document.getElementById("overlay").classList.remove("show");
        selectedRecipeId = null;
        restorePopup();
    }
    catch (error) {
        console.log(error);
    }

}

function closePopup() {
    let button = document.getElementById("closePopup");
    button.addEventListener("click", function () {
        document.getElementById("overlay").classList.remove("show");
        restorePopup();
        selectedRecipeId = null;
    });

}

async function init() {
    try {
        await getData();
        await getUser();
    }
    catch (error) {
        window.location.href = "/login";
        return;
    }

    updateUserInfo();
    logout();
    renderRecipes();
    openPopup();
    closePopup();
    restorePopup();
}

init();
