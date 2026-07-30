import * as api from "./api.js";

let recipe = null;
let users = [];
let showEditButtons = false;
let currentUser;
let selectedRecipeId = null;
let currentServings = 0;
let originalIngredients = [];
let selectedRating = 0;
let userComment = null;
let comments = [];

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

    await getComments();
    await getUserComment();
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
        ingred.push(`<li>${ingredient.amount} ${ingredient.unit} ${ingredient.name}</li>`);
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

    let commentForm = "";

    if (!userComment) {
        commentForm = `
        <textarea id="commentText" placeholder="Skriv en recension..."></textarea>
        <button id="sendComment">Skicka betyg och recension</button>
    `;
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
                <p>👁️${recipe.views}</p>
                <p>❤️${recipe.favoriteCount}</p>
                <p>⭐${recipe.averageRating}(${recipe.ratingCount})</p>
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
        <div class="ratingContainer">
            <h2><span>★</span>${recipe.averageRating} (${recipe.ratingCount})</h2>
            <p>Ditt betyg:</p>
            <div class="stars">
                <span data-rating="1">★</span>
                <span data-rating="2">★</span>
                <span data-rating="3">★</span>
                <span data-rating="4">★</span>
                <span data-rating="5">★</span>
            </div>
            <div id="ratingButtons">
                <button id="deleteRating" style="display:none;">Ta bort betyg</button>
            </div>
        </div>
        <div class="commentsContainer">
            <h2>Recensioner</h2>
            <div id="comments"></div>
            ${commentForm}
        </div>
    </div>
    `
    recipeContainer.id = "recipeContainer";
    document.querySelector("main").appendChild(recipeContainer);
    selectRating();
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
    renderComments();
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
            <li>${amount} ${ingredient.unit} ${ingredient.name}</li>
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

function selectRating() {
    let stars = document.querySelectorAll(".stars span");

    for (let star of stars) {
        star.addEventListener("click", function () {
            selectedRating = Number(star.dataset.rating);
            updateStars(stars);
        });
    }
    updateStars(stars);
}

function updateStars(stars) {
    for (let star of stars) {
        if (
            Number(star.dataset.rating) <= selectedRating
        ) {
            star.classList.add("rated");
        }
        else {
            star.classList.remove("rated");
        }
    }
}

async function getUserComment() {
    for (let comment of comments) {
        if (
            comment.userId === currentUser.id &&
            comment.recipeId === recipe.id
        ) {
            userComment = comment;
            selectedRating = comment.rating;
            return;
        }
    }
}

function openPopup() {
    let buttons = document.querySelectorAll(".edit");

    for (let button of buttons) {
        button.addEventListener("click", function (e) {
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

async function getComments() {
    comments = await api.getRequest(
        "/api/comments/" + recipe.id,
        true
    );
}

function renderComments() {
    let container = document.getElementById("comments");
    container.innerHTML = "";

    if (comments.length === 0) {
        container.innerHTML = "<p>Inga recensioner ännu.</p>";
        return;
    }

    for (let comment of comments) {
        let username = getUserNameById(comment.userId);
        let buttons = "";
        if (comment.userId === currentUser.id) {
            buttons = `
            <div class="buttons">
                <button class="editComment" data-id="${comment.id}">Redigera</button>
                <button class="deleteComment" data-id="${comment.id}">Ta bort</button>
            </div>    
            `;
        }

        container.innerHTML += `
            <div class="comment">
            <div class="commentInfo">
                <h3>@${username}</h3>
                <p>⭐ ${comment.rating ?? 0}/5</p>
            </div>
                <p id="commentText-${comment.id}">${comment.text ?? ""}</p>
                <small>${comment.createdAt.split("T")[0]}</small>

                ${buttons}
            </div>
        `;
    }

    editComments();
    deleteComments();
}

async function sendComment() {
    let button = document.getElementById("sendComment");
    if (!button) {
        return;
    }

    button.addEventListener("click", async function () {
        if (selectedRating === 0) {
            alert("Välj betyg först.");
            return;
        }

        let text = document.getElementById("commentText").value;

        try {
            if (userComment) {
                await api.patchRequest("/api/comments/" + userComment.id, { text: text, rating: selectedRating }, true);
            }

            else {
                await api.postRequest("/api/comments", { recipeId: recipe.id, text: text, rating: selectedRating }, true);
            }

            location.reload();
        }
        catch (error) {
            console.log(error);
        }
    });
}

function editComments() {
    let buttons = document.querySelectorAll(".editComment");

    for (let button of buttons) {
        button.addEventListener("click", function () {
            let id = button.dataset.id;

            userComment = comments.find(comment => comment.id === Number(id));

            selectedRating = userComment.rating;

            let stars = document.querySelectorAll(".stars span");
            updateStars(stars);

            let paragraph = document.getElementById("commentText-" + id);
            let oldText = paragraph.textContent;

            paragraph.innerHTML = `
                <textarea id="editComment-${id}">${oldText}</textarea>
                <button class="saveComment" data-id="${id}">
                    Spara
                </button>
                <button class="cancelComment" data-id="${id}">
                    Avbryt
                </button>
            `;

            document.querySelector(".saveComment").addEventListener("click", async function () {
                let newText = document.getElementById(`editComment-${id}`).value;

                await api.patchRequest(
                    "/api/comments/" + id,
                    {
                        text: newText,
                        rating: selectedRating
                    },
                    true
                );

                location.reload();
            });

            document.querySelector(".cancelComment").addEventListener("click", async function () {
                location.reload();
            });
        });
    }
}

function deleteComments() {
    let buttons = document.querySelectorAll(".deleteComment");
    for (let button of buttons) {
        button.addEventListener("click", async function (e) {
            let id = button.dataset.id;
            if (!confirm("Vill du ta bort kommentaren?")) {
                return;
            }

            try {
                await api.deleteRequest("/api/comments/" + id, true);
                location.reload();
            }

            catch (error) {
                console.log(error);
            }
        }
        );
    }
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
    sendComment();
}

init();
