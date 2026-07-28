import * as api from "./api.js";

let recipe = null;
let users = [];
let showEditButtons = false;
let currentUser;
let selectedRecipeId = null;
let currentServings = 0;
let originalIngredients = [];

async function getUser() {
    currentUser = await api.getRequest("/api/profile", true);
}

async function getRecipe() {
    let path = window.location.pathname;
    let id = Number(path.split("/")[2]);

    recipe = await api.getRequest("/api/recipes/" + id);
    currentServings = recipe.servings;
    originalIngredients = structuredClone(recipe.ingredients);

    users = await api.getRequest("/api/users", true);

    renderRecipe(recipe);
}

function getUserNameById(id) {
    for (let usr of users) {
        if (usr.id === id) {
            return usr.username;
        }
    }
}

function renderRecipe(recipe) {
    let recipeContainer = document.createElement("div");

    let diets = [];
    let ingred = [];
    let instru = [];
    let buttonHtml;

    for (let diet of recipe.dietary) {
        diets.push(`<p>${diet}</p>`);
    }

    for (let ingredient of recipe.ingredients) {
        ingred.push(`<li>${ingredient.amount}${ingredient.unit} ${ingredient.name}</li>`);
    }

    for (let instruction of recipe.instructions) {
        instru.push(`<li><input type="checkbox">${instruction}</li>`);
    }

    if (recipe.author === currentUser.id) {
        showEditButtons = true;
    }

    if (showEditButtons) {
        buttonHtml = `<button class="edit">…</button>`;
    }
    else {
        buttonHtml = `<button class="heart">♥</button>`;
    }

    recipeContainer.innerHTML = `
        <div id="image"><img src="/assets${recipe.imageUrl}" alt=""></div>
            <div id="text">
            ${buttonHtml}
                <div id="description">
                    <h1>${recipe.name} <span>av ${getUserNameById(recipe.author)}</span></h1>
                    <h2>${recipe.description}</h2>
                    <div id="info">
                        <p>${recipe.category}</p>
                        <p>${recipe.time}min</p>
                        <p>${recipe.country}</p>
                        <div id="diets">
                            ${diets.join("")}
                        </div>
                    </div>
                </div>
                <div id="cook">
                    <div id="amount">
                        <button class="subtract">-</button>
                        <button class="servings">${recipe.servings} portioner</button>
                        <button class="add">+</button>
                    </div>
                    <div id="ingredients">
                        <ul>
                            ${ingred.join("")}
                        </ul>
                    </div>
                    <div id="instructions">
                        <ul>
                            ${instru.join("")}
                        </ul>
                    </div>
                </div>
            </div>
    `

    recipeContainer.id = "recipeContainer";
    document.querySelector("main").appendChild(recipeContainer);
    if (currentUser.favourites.includes(recipe.id)) {
        document.querySelector(".heart").classList.add("fav");
    }
    if (showEditButtons) {
        openPopup();
    }
    else {
        favorite();
    }

    editServings();
}

function editServings() {
    let add = document.querySelector(".add");
    let sub = document.querySelector(".subtract");
    let servings = document.querySelector(".servings");

    add.addEventListener("click", function () {
        currentServings++;
        updateIngredients();
        servings.textContent = `${currentServings} portioner`;
    });

    sub.addEventListener("click", function () {
        if (currentServings > 1) {
            currentServings--;
            updateIngredients();
            servings.textContent = `${currentServings} portioner`;
        }
    });
}

function updateIngredients() {
    let list = document.querySelector("#ingredients ul");
    list.innerHTML = "";

    let factor = currentServings / recipe.servings;

    for (let ingredient of originalIngredients) {
        let amount = ingredient.amount * factor;

        // Snyggare utskrift
        if (amount % 1 !== 0) {
            amount = amount.toFixed(1);
        }

        list.innerHTML += `
            <li>${amount}${ingredient.unit} ${ingredient.name}</li>
        `;
    }
}

function favorite() {
    let hearts = document.querySelectorAll(".heart");
    for (let heart of hearts) {
        heart.addEventListener("click", async function (e) {
            e.preventDefault();

            let recipeId = recipe.id;

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

function openPopup() {
    let buttons = document.querySelectorAll(".edit");

    for (let button of buttons) {
        button.addEventListener("click", function (e) {
            console.log("Edit klickad");
            e.preventDefault();
            e.stopPropagation();
            selectedRecipeId = recipe.id
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

        selectedRecipeId = null;
        location.href = "/home";
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
        await getUser();
        await getRecipe();
    } catch (error) {
        document.querySelector("main").innerHTML = "Kunde inte hitta recept...";
        document.querySelector("main").style.color = "white";
        document.querySelector("main").style.fontSize = "50px";
    }

    closePopup();
    restorePopup();
}

init();
