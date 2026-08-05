import * as api from "./api.js";

let recipes = [];
let myRecipes = [];
let users = [];
let categories = [];
let countries = [];
let dietaries = [];
let currentUser;
let selectedRecipeId = null;
let showEditButtons = true;
let profileId = null;
let isOwnProfile = true;

function translateRarity(rarity) {
    if (rarity === "common") {
        return "VANLIG";
    }

    if (rarity === "uncommon") {
        return "OVANLIG";
    }

    if (rarity === "rare") {
        return "SÄLLSYNT";
    }

    if (rarity === "epic") {
        return "EPISK";
    }

    if (rarity === "legendary") {
        return "LEGENDARISK";
    }

    return rarity;
}

async function getData() {
    recipes = await api.getRequest("/api/recipes", true);

    categories = await api.getRequest("/api/categories");
    countries = await api.getRequest("/api/countries");
    dietaries = await api.getRequest("/api/dietaries");

    let params = new URLSearchParams(window.location.search);

    profileId = params.get("id");

    // Om ett profil-ID finns i URL:en
    if (profileId) {

        // Hämta den inloggade användaren
        let loggedInUser = await api.getRequest(
            "/api/profile",
            true
        );

        // Om profilen som visas är den inloggade användaren
        if (Number(profileId) === Number(loggedInUser.id)) {

            isOwnProfile = true;
            profileId = null;

            currentUser = loggedInUser;

            myRecipes = await api.getRequest(
                "/api/profile/recipes",
                true
            );

            showEditButtons = true;
        }
        else {

            isOwnProfile = false;

            currentUser = await api.getRequest(
                "/api/users/" + profileId,
                true
            );

            myRecipes = await api.getRequest(
                "/api/users/" + profileId + "/recipes",
                true
            );

            showEditButtons = false;
        }

    }
    else {

        // Ingen profil angiven → visa min egen profil
        isOwnProfile = true;

        currentUser = await api.getRequest(
            "/api/profile",
            true
        );

        myRecipes = await api.getRequest(
            "/api/profile/recipes",
            true
        );

        showEditButtons = true;
    }
}

async function getUser() {
    createUserInfo(currentUser);

    if (isOwnProfile) {
        generateForm(currentUser);
    }

    let recipeTitle = document.getElementById("recipeTitle");

    if (isOwnProfile) {
        recipeTitle.textContent = "Mina Recept";
    }
    else {
        recipeTitle.textContent =
            "Recept av " + currentUser.username;

        showEditButtons = false;
    }
}

function isOtherProfile() {
    let params = new URLSearchParams(window.location.search);

    return params.get("id") !== null;
}

function setupProfilePage() {

    let form = document.querySelector("form");
    let recipeTitle = document.getElementById("recipeTitle");
    let myProfileButton = document.getElementById("myProfileButton");

    if (isOwnProfile) {

        form.style.display = "grid";
        myProfileButton.style.display = "none";

        generateForm(currentUser);

        recipeTitle.textContent = "Mina Recept";

    }
    else {

        form.style.display = "none";
        myProfileButton.style.display = "block";

        recipeTitle.textContent =
            "Recept av " + currentUser.username;
    }
}

function myProfileButton() {
    let button = document.getElementById("myProfileButton");
    button.addEventListener("click", function () {
        window.location.href = "/profile";
    });

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

    let params = new URLSearchParams(window.location.search);
    let isOtherProfile = params.get("id") !== null;

    let emailHtml = "";

    if (!isOtherProfile) {
        emailHtml = `<h2 id="two">${user.email}</h2>`;
    }

    let titleHtml = "";

    if (isOwnProfile) {
        titleHtml = `
        <select id="title">
            ${user.unlockedTitles.map(function (title) {
            return `
                    <option value="${title.name}" ${title.name === user.selectedTitle ? "selected" : ""}>
                        ${title.name} - ${translateRarity(title.rarity)}
                    </option>
                `;
        }).join("")}
        </select>
    `;
    }
    else {
        titleHtml = `<h2 id="title">${user.title}</h2>`;
    }

    let ratingHtml = "";

    if (user.ratingCount > 0) {
        ratingHtml = `
            <h2 id="rating">
                <span>★</span>${user.averageRating} (${user.ratingCount} betyg)
            </h2>
        `;
    }
    else {
        ratingHtml = `
            <h2 id="rating">
                <span>★</span>Inga betyg ännu
            </h2>
        `;
    }

    userInfo.innerHTML = `
        <p>${firstLetter}</p>

        <div id="info">
            <h1 id="one">${user.username.toUpperCase()}</h1>

            ${emailHtml}

            ${titleHtml}

            <h2 id="three">${getDate(user)}</h2>

            <h2 id="four">
                <img src="assets/icons/recipe.png" alt="">
                ${getRecipeAmount()}
            </h2>

            <h2 id="five">
                <img src="assets/icons/heart.png" alt="">
                ${getFavAmount(user)}
            </h2>

            ${ratingHtml}
        </div>
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

        let buttonHtml;

        if (showEditButtons) {
            buttonHtml = `<button class="edit">…</button>`;
        }
        else {
            buttonHtml = `<button class="heart">♥</button>`;
        }

        div.innerHTML = `
            <div class="author">${currentUser.username}</div>

            <div class="image">
                <img src="assets${oneRecipe.imageUrl}" alt="">
            </div>

            <div class="content">
                <h1 class="recipeName">${oneRecipe.name}</h1>

                <div class="stats">
                    <h2><span class="miniEye"><img src="assets/icons/eye.jpg"></span>${oneRecipe.views}</h2>
                    <h2><span class="miniHeart">♥</span>${oneRecipe.favoriteCount}</h2>
                    <h2><span class="miniStar">★</span>${oneRecipe.averageRating}(${oneRecipe.ratingCount})</h2>
                </div>

                <div class="info">
                    <p>${oneRecipe.time}min</p>
                    <p>${oneRecipe.country}</p>
                    <p>${oneRecipe.category}</p>
                </div>

                <div class="diets"></div>

                <div class="cardButtons">
                    <button class="viewRecipe">Visa recept</button>
                    ${buttonHtml}
                </div>
            </div>
        `;

        let button = div.querySelector(".heart");

        if (button && oneRecipe.isFavourite) {
            button.classList.add("fav");
        }

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

        // Anpassar storleken på receptnamnet
        let recipeName = div.querySelector(".recipeName");

        let fontSize = 24;

        recipeName.style.fontSize = fontSize + "px";

        while (
            recipeName.scrollWidth > recipeName.clientWidth &&
            fontSize > 14
        ) {
            fontSize--;

            recipeName.style.fontSize = fontSize + "px";
        }

        let view = div.querySelector(".viewRecipe");

        view.addEventListener("click", function () {
            location.href = "/recipe/" + oneRecipe.id;
        });
    }

    if (recipeContainer.children.length === 0) {
        recipeContainer.innerHTML = `<p id="notFound">Hittade inga recept</p>`;
    }

    if (showEditButtons) {
        openPopup();
    }
    else {
        favorite();
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

function searchUsers() {
    let input = document.getElementById("userSearchInput");
    let resultsContainer = document.getElementById("userSearchResults");

    input.addEventListener("input", async function () {

        let searchValue = input.value.trim();

        resultsContainer.innerHTML = "";

        if (searchValue === "") {
            return;
        }

        try {
            let results = await api.getRequest(
                "/api/users/search?username=" +
                encodeURIComponent(searchValue)
            );

            for (let user of results) {
                let result = document.createElement("div");
                result.classList.add("userSearchResult");
                result.textContent = user.username;
                result.addEventListener("click", function () {
                    window.location.href = "/profile?id=" + user.id;
                });

                resultsContainer.appendChild(result);
            }

            if (results.length === 0) {
                resultsContainer.innerHTML =
                    "<p>Ingen användare hittades.</p>";
            }

        }
        catch (error) {
            console.log(error);
        }
    });
}

function favorite() {
    let buttons = document.querySelectorAll(".heart");

    for (let button of buttons) {
        button.addEventListener("click", async function () {

            let card = button.closest(".card");
            let recipeId = Number(card.dataset.recipeId);

            try {
                if (button.classList.contains("fav")) {

                    await api.deleteRequest(
                        "/api/favourites/" + recipeId,
                        true
                    );

                    button.classList.remove("fav");
                }
                else {

                    await api.postRequest(
                        "/api/favourites",
                        {
                            recipeId: recipeId
                        },
                        true
                    );

                    button.classList.add("fav");
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}

function titleSelector() {
    if (!isOwnProfile) {
        return;
    }

    let title = document.getElementById("title");

    title.addEventListener("change", async function () {
        try {
            await api.patchRequest(
                "/api/profile/title",
                {
                    selectedTitle: title.value
                },
                true
            );

            currentUser.selectedTitle = title.value;
            currentUser.title = title.value;
        }
        catch (error) {
            console.log("Kunde inte uppdatera titel:", error);
        }
    });
}

async function init() {
    try {
        await getData();
    }
    catch (error) {
        window.location.href = "/login";
        return;
    }

    createUserInfo(currentUser);

    if (isOwnProfile) {
        titleSelector();
        updateUserInfo();
        logout();
        openPopup();
        closePopup();
        restorePopup();
    }

    setupProfilePage();
    searchUsers();
    myProfileButton();
    renderRecipes();
}

init();