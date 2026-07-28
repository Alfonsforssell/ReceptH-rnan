import * as api from "./api.js";

let recipes = [];
let categories = [];
let countries = [];
let dietaries = [];
let users = [];
let showEditButtons = false;
let selectedRecipeId = null;

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

function renderRecipes(filteredRecipes = recipes) {
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
        <div class="empty"></div>
        ${buttonHtml}
        <div class="content">
                <h1>${oneRecipe.name}</h1>
                <p>${oneRecipe.description}</p>
                <div class="info">
                    <h2>${oneRecipe.time} min</h2>
                    <h2>${oneRecipe.category}</h2>
                    <h2>${oneRecipe.country}</h2>
                    <a>@${getUserNameById(oneRecipe.author)}</a>
                </div>
                <div class="diets"></div>
        </div>`;
        div.style.backgroundImage = `url(assets${oneRecipe.imageUrl})`
        let button = div.querySelector(".heart");
        if (oneRecipe.isFavourite) {
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

        let content = div.querySelector(".content");
        content.addEventListener("click", function (e) {
            location.href = "/recipe/" + oneRecipe.id;
        })
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

function favorite() {
    let hearts = document.querySelectorAll(".heart");
    for (let heart of hearts) {
        heart.addEventListener("click", async function (e) {
            e.preventDefault();

            let recipeId = Number(heart.closest("div").dataset.recipeId);

            let body = {
                recipeId: recipeId
            };

            try {
                if (!heart.classList.contains("fav")) {
                    await api.postRequest("/api/favourites", body, true);
                    heart.classList.add("fav");
                }
                else {
                    await api.deleteRequest("/api/favourites/" + recipeId, true);
                    heart.classList.remove("fav");
                }
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

async function updateRecipes() {
    let form = document.getElementById("filter");
    let countryValue = form.elements.country.value;
    let categoryValue = form.elements.category.value;
    let timeValue = form.elements.time.value;
    let dietaryValue = form.elements.preference.value;
    let favValue = form.elements.favs.value;

    let queryParts = [];

    if (!countryValue.includes("All")) {
        queryParts.push("country=" + countryValue);
    }

    if (!categoryValue.includes("All")) {
        queryParts.push("category=" + categoryValue);
    }

    if (!timeValue.includes("All")) {
        queryParts.push("time=" + timeValue);
    }

    if (!dietaryValue.includes("All")) {
        queryParts.push("dietary=" + dietaryValue);
    }

    if (favValue !== "All") {
        queryParts.push("favs=" + favValue);
    }

    let queryString = queryParts.join("&");
    let url = "/api/recipes";

    if (queryString) {
        url += "?" + queryString;
    }

    try {
        let recipes = await api.getRequest(url, true);
        showEditButtons = false;
        renderRecipes(recipes);
    } catch (err) {
        console.log(err.message);
    }
}

function submitFilters() {
    let form = document.getElementById("filter");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        updateRecipes();
    })
}

async function removeFilters() {
    let button = document.getElementById("removeFilters");
    button.addEventListener("click", async function () {
        document.getElementById("searchValue").value = "";
        let filterForm = document.getElementById("filter");
        filterForm.reset();
        let recipes = await api.getRequest("/api/recipes", true);
        showEditButtons = false;
        renderRecipes(recipes);
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
    let search = document.getElementById("search");
    search.addEventListener("submit", async function (e) {
        e.preventDefault();

        let searchValue = document.getElementById("searchValue").value;
        try {
            let result;
            if (searchValue.trim() === "") {
                result = await api.getRequest("/api/recipes", true);
            } else {
                result = await api.getRequest("/api/recipes/search?q=" + encodeURIComponent(searchValue), true);
            }
            showEditButtons = false;
            renderRecipes(result);
        } catch (error) {
            console.log(error);
        }
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
            console.log("Edit klickad");
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
    window.location.href = "/edit?id=" + selectedRecipeId;
}

function showDeleteConfirmation() {
    console.log("showDeleteConfirmation");
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
    } catch (error) {
        window.location.href = "/login";
        return;
    }
    createForm();
    renderRecipes();
    submitFilters();
    search();
    showFavorites();
    showMyRecipes();
    removeFilters();
    logout();
    closePopup();
    restorePopup();
}

init();