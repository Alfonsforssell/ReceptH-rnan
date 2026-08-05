import * as api from "./api.js";

let recipes = [];
let categories = [];
let countries = [];
let dietaries = [];
let users = [];
let showEditButtons = false;
let selectedRecipeId = null;
let currentSort = "default";

async function getData() {
    recipes = await api.getRequest("/api/recipes", true);
    categories = await api.getRequest("/api/categories");
    countries = await api.getRequest("/api/countries");
    dietaries = await api.getRequest("/api/dietaries");
    users = await api.getRequest("/api/users", true);
}

function getUserNameById(id) {
    for (let usr of users) {
        if (usr.id === id) {
            return usr.username;
        }
    }
}

function getPopularScore(recipe) {
    let views = recipe.views || 0;
    let favourites = recipe.favoriteCount || 0;
    let rating = recipe.averageRating || 0;

    return (
        views * 0.2 +
        favourites * 0.4 +
        rating * 20 * 0.4
    );
}


function getDiscoverScore(recipe) {
    let views = recipe.views || 0;
    let favourites = recipe.favoriteCount || 0;
    let rating = recipe.averageRating || 0;

    return (
        rating * 50 -
        views * 0.05 -
        favourites * 2
    );
}


function sortRecipes(recipeList) {
    let sortedRecipes = [...recipeList];

    switch (currentSort) {

        case "popular":
            sortedRecipes.sort(function (a, b) {
                return getPopularScore(b) - getPopularScore(a);
            });
            break;

        case "discover":
            sortedRecipes.sort(function (a, b) {
                return getDiscoverScore(b) - getDiscoverScore(a);
            });
            break;

        case "rating-desc":
            sortedRecipes.sort(function (a, b) {
                return (b.averageRating || 0) - (a.averageRating || 0);
            });
            break;

        case "rating-asc":
            sortedRecipes.sort(function (a, b) {
                return (a.averageRating || 0) - (b.averageRating || 0);
            });
            break;

        case "time-asc":
            sortedRecipes.sort(function (a, b) {
                return a.time - b.time;
            });
            break;

        case "time-desc":
            sortedRecipes.sort(function (a, b) {
                return b.time - a.time;
            });
            break;

        case "views-desc":
            sortedRecipes.sort(function (a, b) {
                return (b.views || 0) - (a.views || 0);
            });
            break;

        case "views-asc":
            sortedRecipes.sort(function (a, b) {
                return (a.views || 0) - (b.views || 0);
            });
            break;

        case "newest":
            sortedRecipes.sort(function (a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            break;

        case "oldest":
            sortedRecipes.sort(function (a, b) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            break;

        case "name-asc":
            sortedRecipes.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            break;

        case "name-desc":
            sortedRecipes.sort(function (a, b) {
                return b.name.localeCompare(a.name);
            });
            break;
    }

    return sortedRecipes;
}

function renderRecipes(filteredRecipes = sortRecipes(recipes)) {
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
            <div class="author" data-user-id="${oneRecipe.author}">
                ${getUserNameById(oneRecipe.author)}
            </div>

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

        let author = div.querySelector(".author");

        author.addEventListener("click", function () {
            let userId = author.dataset.userId;

            window.location.href = "/profile?id=" + userId;
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

function sortOnChange() {
    let select = document.getElementById("sortRecipes");

    select.addEventListener("change", function () {
        currentSort = this.value;
        updateRecipes();
    });
}

function favorite() {
    let hearts = document.querySelectorAll(".heart");

    for (let heart of hearts) {
        heart.addEventListener("click", async function (e) {
            e.preventDefault();
            e.stopPropagation();

            let recipeId = Number(
                heart.closest(".card").dataset.recipeId
            );

            let body = {
                recipeId: recipeId
            };

            try {
                if (!heart.classList.contains("fav")) {
                    await api.postRequest(
                        "/api/favourites",
                        body,
                        true
                    );
                }
                else {
                    await api.deleteRequest(
                        "/api/favourites/" + recipeId,
                        true
                    );
                }

                await getData();

                updateRecipes(recipes);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}

function createForm() {
    let form = document.getElementById("filter");
    let selectCountry = form.elements.country;
    let selectCategory = form.elements.category;
    let selectTime = form.elements.time;
    let selectDietary = form.elements.preference;

    for (let country of countries) {
        let option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        selectCountry.appendChild(option);
    }

    for (let category of categories) {
        let option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        selectCategory.appendChild(option);
    }

    for (let diet of dietaries) {
        let option = document.createElement("option");
        option.value = diet;
        option.textContent = diet;
        selectDietary.appendChild(option);
    }
}

async function updateRecipes(recipeList = recipes) {
    let form = document.getElementById("filter");

    let countryValue = form.elements.country.value;
    let categoryValue = form.elements.category.value;
    let timeValue = form.elements.time.value;
    let dietaryValue = form.elements.preference.value;
    let favValue = form.elements.favs.value;
    let searchValue = document.getElementById("searchValue").value
        .trim()
        .toLowerCase();

    let filteredRecipes = [];

    for (let recipe of recipeList) {

        if (
            countryValue !== "All countries" &&
            recipe.country !== countryValue
        ) {
            continue;
        }

        if (
            categoryValue !== "All categories" &&
            recipe.category !== categoryValue
        ) {
            continue;
        }

        if (timeValue !== "All") {
            if (timeValue === "100" && recipe.time <= 60) {
                continue;
            }

            if (
                timeValue !== "100" &&
                recipe.time >= Number(timeValue)
            ) {
                continue;
            }
        }

        if (
            dietaryValue !== "All" &&
            !recipe.dietary.includes(dietaryValue)
        ) {
            continue;
        }

        if (
            favValue === "favorites" &&
            !recipe.isFavourite
        ) {
            continue;
        }

        if (
            favValue === "nonfavorites" &&
            recipe.isFavourite
        ) {
            continue;
        }

        if (
            searchValue !== "" &&
            !recipe.name.toLowerCase().includes(searchValue)
        ) {
            continue;
        }

        filteredRecipes.push(recipe);
    }

    showEditButtons = false;
    renderRecipes(sortRecipes(filteredRecipes));
}

function filterOnChange() {
    let form = document.getElementById("filter");
    let selects = form.querySelectorAll("select");

    for (let select of selects) {
        select.addEventListener("change", function () {
            updateRecipes();
        });
    }
}

async function removeFilters() {
    let button = document.getElementById("removeFilters");
    button.addEventListener("click", async function () {
        document.getElementById("searchValue").value = "";
        let filterForm = document.getElementById("filter");
        filterForm.reset();
        let allRecipes = await api.getRequest("/api/recipes", true);
        showEditButtons = false;
        renderRecipes(allRecipes);
    });
}

function showFavorites() {
    let favoritesLink = document.querySelectorAll(".favoritesLink");
    for (let link of favoritesLink) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            let form = document.getElementById("filter");
            form.elements.favs.value = "favorites";
            updateRecipes();
            document.getElementById("recipeContainer").scrollIntoView();
        });
    }

}

async function showMyRecipes() {
    let myRecipesLink = document.querySelectorAll(".myRecipesLink");
    for (let link of myRecipesLink) {
        link.addEventListener("click", async function (e) {
            e.preventDefault();
            try {
                let myRecipes = await api.getRequest("/api/profile/recipes", true);
                showEditButtons = true;
                renderRecipes(myRecipes);
                document.getElementById("recipeContainer").scrollIntoView();
            }
            catch (error) {
                console.log(error);
            }
        });
    }

}

function search() {
    let searchInput = document.getElementById("searchValue");
    let userSearchInput = document.getElementById("profileSearchValue");

    searchInput.addEventListener("input", function () {
        if (searchInput.value.trim() !== "") {
            userSearchInput.value = "";
        }
        updateRecipes();
    });

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

function openPopup() {
    let buttons = document.querySelectorAll(".edit");

    for (let button of buttons) {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            selectedRecipeId = Number(button.closest("[data-recipe-id]").dataset.recipeId);
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

function searchProfiles() {
    let input = document.getElementById("profileSearchValue");
    let recipeInput = document.getElementById("searchValue");
    let recipeContainer = document.getElementById("recipeContainer");

    input.addEventListener("input", async function () {
        let searchValue = input.value.trim();
        // Töm receptsökningen när profilsökningen används
        if (searchValue !== "") {
            recipeInput.value = "";
        }
        // Om profilsökningen är tom visas recepten igen
        if (searchValue === "") {
            renderRecipes();
            return;
        }
        recipeContainer.innerHTML = "";
        try {
            let results = await api.getRequest(
                "/api/users/search?username=" +
                encodeURIComponent(searchValue)
            );
            if (results.length === 0) {
                recipeContainer.innerHTML =
                    `<p id="notFound">Ingen användare hittades.</p>`;
                return;
            }
            for (let user of results) {
                let card = document.createElement("div");
                card.classList.add("card", "userCard");
                let firstLetter =
                    user.username.charAt(0).toUpperCase();
                let recipeAmount = user.recipeCount ?? 0;
                let favouriteAmount = user.favouriteCount ?? 0;
                card.innerHTML = `
                <div class="userProfileIcon">
                    ${firstLetter}
                </div>
                <div class="userProfileContent">
                    <h1 class="userProfileUsername">
                        ${user.username}
                    </h1>
                    <p class="userProfileDate">
                        Registrerades ${formatDate(user.createdAt)}
                    </p>
                    <div class="userProfileStats">
                        <span>
                            <img src="assets/icons/recipe.png" alt="">${recipeAmount} recept
                        </span>
                        <span>
                            ♥ ${favouriteAmount} favoriter
                        </span>
                    </div>
                </div>
            `;
                card.addEventListener("click", function () {
                    window.location.href =
                        "/profile?id=" + user.id;
                });
                recipeContainer.appendChild(card);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}

function formatDate(date) {
    let dateObject = new Date(date);

    return dateObject.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}

async function init() {
    try {
        await getData();
    } catch (error) {
        window.location.href = "/login";
        return;
    }
    createForm();
    renderRecipes();
    filterOnChange();
    search();
    showFavorites();
    showMyRecipes();
    removeFilters();
    logout();
    closePopup();
    restorePopup();
    sortOnChange();
    searchProfiles();
}

init();