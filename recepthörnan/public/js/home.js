import * as api from "./api.js";

let recipes = [];
let categories = [];
let countries = [];
let dietaries = [];
let users = [];

async function getData() {
    recipes = await api.getRequest("/api/recipes", true);
    console.log(recipes);

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

function getIdByName(name) {
    for (let recipe of recipes) {
        if (recipe.name == name) {
            return recipe.id;
        }
    }
}

function renderRecipes(filteredRecipes = recipes) {
    let recipeContainer = document.getElementById("recipeContainer");
    recipeContainer.innerHTML = "";

    for (let oneRecipe of filteredRecipes) {
        let a = document.createElement("a");
        a.href = "/assets/html/productPage.html?id=" + oneRecipe.id;

        a.dataset.recipeId = oneRecipe.id;

        a.innerHTML = `
        <img class="cardImg" src="assets${oneRecipe.imageUrl}" alt="">
                <h1>${oneRecipe.name}</h1>
                <p>${oneRecipe.description}</p>
                <div class="info">
                    <h2>${oneRecipe.time} min</h2>
                    <h2>${oneRecipe.category}</h2>
                    <h2>${oneRecipe.country}</h2>
                    <h2>@${getUserNameById(oneRecipe.author)}</h2>
                </div>
                <button class="heart">♥</button>
        `;

        let button = a.querySelector(".heart");
        if (oneRecipe.isFavourite) {
            button.classList.add("fav");
        }

        for (let diet of dietaries) {
            if (oneRecipe.dietary.includes(diet)) {
                let info = a.querySelector(".info");
                let img = document.createElement("img");
                img.src = `assets/icons/${diet}.svg`;
                img.classList.add("icon");
                info.appendChild(img);
            }
        }
        recipeContainer.appendChild(a);
        a.classList.add("card");
    }
    if (recipeContainer.children.length === 0) {
        recipeContainer.innerHTML = `<p id="notFound">Hittade inga recept</p>`;
    }
    favorite();

}

function favorite() {
    let hearts = document.querySelectorAll(".heart");
    for (let heart of hearts) {
        heart.addEventListener("click", async function (e) {
            e.preventDefault();

            let recipeId = Number(heart.closest("a").dataset.recipeId);

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



function showFavorites() {
    let favoritesLink = document.getElementById("favoritesLink");
    favoritesLink.addEventListener("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("filter");
        form.elements.favs.value = "favorites";
        updateRecipes();
        document.getElementById("recipeContainer").scrollIntoView();
    });
}

async function showMyRecipes() {
    let myRecipesLink = document.getElementById("myRecipesLink");
    myRecipesLink.addEventListener("click", async function (e) {
        e.preventDefault();
        try {
            let myRecipes = await api.getRequest("/api/profile/recipes", true);
            renderRecipes(myRecipes);
            document.getElementById("recipeContainer").scrollIntoView();
        }
        catch (error) {
            console.log(error);
        }
    });
}

function search() {
    let search = document.getElementById("search");
    search.addEventListener("submit", async function (e) {
        e.preventDefault();
        let searchValue = document.getElementById("searchValue").value;
        try {
            let result = await api.getRequest(
                "/api/recipes/search?q=" + searchValue,
                true
            );
            renderRecipes(result);
        }
        catch (error) {
            console.log(error);
        }
    })
}

function about() {
    let button = document.getElementById("aboutUs");
    button.addEventListener("click", function (e) {
        window.location.href = "/about";
    })
}

async function init() {
    await getData();
    createForm();
    renderRecipes();
    submitFilters();
    search();
    showFavorites();
    showMyRecipes();
    about();
}

init();