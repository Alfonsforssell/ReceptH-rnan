import * as api from "./api.js";

let recipe = null;

async function getRecipe() {
    let id = Number(window.location.pathname.split("/")[3]);

    recipe = await api.getRequest("/api/recipes/" + id, true);

    fillRecipe();
}

function fillRecipe() {
    document.querySelector("#recipeName").value = recipe.name;
    document.querySelector("#recipeDescription").value = recipe.description;
    document.querySelector("#recipeCategory").value = recipe.category;
    document.querySelector("#recipeTime").value = recipe.time;
    document.querySelector("#recipeCountry").value = recipe.country;

    document.querySelector(".servings").textContent =
        `${recipe.servings} portioner`;

    document.querySelector("#previewImage").src =
        "/assets" + recipe.imageUrl;

    let checkboxes = document.querySelectorAll("#diets input");

    for (let checkbox of checkboxes) {
        checkbox.checked = recipe.dietary.includes(checkbox.value);
    }

    let ingredientList = document.querySelector("#ingredientList");
    ingredientList.innerHTML = "";

    for (let ingredient of recipe.ingredients) {

        let div = document.createElement("div");
        div.classList.add("ingred");

        div.innerHTML = `
            <input class="ingredAmount"
                type="text"
                value="${ingredient.amount}">

            <select class="ingredType">
                <option value="mått">Mått</option>
                <option value="g">g</option>
                <option value="tesked">tesked</option>
                <option value="matsked">matsked</option>
                <option value="cl">cl</option>
                <option value="ml">ml</option>
                <option value="dl">dl</option>
                <option value="l">l</option>
                <option value="st">st</option>
            </select>

            <input class="ingredIngredient"
                type="text"
                value="${ingredient.name}">

            <button type="button"
                    class="removeIngredient">✕</button>
        `;

        div.querySelector(".ingredType").value = ingredient.unit;

        div.querySelector(".removeIngredient")
            .addEventListener("click", function () {
                div.remove();
            });

        ingredientList.appendChild(div);
    }

    let instructionList = document.querySelector("#instructionList");
    instructionList.innerHTML = "";

    for (let instruction of recipe.instructions) {

        let div = document.createElement("div");
        div.classList.add("instruction");

        div.innerHTML = `
            <input
                class="instructionInput"
                type="text"
                value="${instruction}">

            <button
                type="button"
                class="removeInstruction">✕</button>
        `;

        div.querySelector(".removeInstruction")
            .addEventListener("click", function () {
                div.remove();
            });

        instructionList.appendChild(div);
    }
}

async function updateRecipe(e) {
    e.preventDefault();

    let id = Number(window.location.pathname.split("/")[3]);

    let formData = new FormData();

    formData.append("name", document.querySelector("#recipeName").value);
    formData.append("description", document.querySelector("#recipeDescription").value);
    formData.append("category", document.querySelector("#recipeCategory").value);
    formData.append("time", document.querySelector("#recipeTime").value);
    formData.append("country", document.querySelector("#recipeCountry").value);

    let servings = Number(
        document.querySelector(".servings").textContent.split(" ")[0]
    );

    formData.append("servings", servings);

    let dietary = [];

    let checked = document.querySelectorAll("#diets input:checked");

    for (let box of checked) {
        dietary.push(box.value);
    }

    formData.append("dietary", JSON.stringify(dietary));

    let ingredients = [];

    let rows = document.querySelectorAll(".ingred");

    for (let row of rows) {
        ingredients.push({
            amount: Number(row.querySelector(".ingredAmount").value),
            unit: row.querySelector(".ingredType").value,
            name: row.querySelector(".ingredIngredient").value
        });
    }

    formData.append("ingredients", JSON.stringify(ingredients));

    let instructions = [];

    let inputs = document.querySelectorAll(".instructionInput");

    for (let input of inputs) {
        instructions.push(input.value);
    }

    formData.append("instructions", JSON.stringify(instructions));

    let image = document.querySelector("#recipeImage").files[0];

    if (image) {
        formData.append("image", image);
    }

    try {
        await api.patchRequest(
            "/api/recipes/" + id,
            formData,
            true
        );

        location.href = "/recipe/" + id;
    }
    catch (error) {
        console.log(error);
    }
}

function editServings() {
    let add = document.querySelector(".add");
    let sub = document.querySelector(".subtract");
    let servings = document.querySelector(".servings");
    let currentServings = 2

    add.addEventListener("click", function () {
        currentServings++;
        servings.textContent = `${currentServings} portioner`;
    });

    sub.addEventListener("click", function () {
        if (currentServings > 1) {
            currentServings--;
            servings.textContent = `${currentServings} portioner`;
        }
    });
}


function addIngredient() {
    let button = document.querySelector("#addIngredient");
    button.addEventListener("click", function () {

        let ingredient = document.createElement("div");
        ingredient.classList.add("ingred");

        ingredient.innerHTML = `
            <input class="ingredAmount" type="text" placeholder="Mängd">

            <select class="ingredType">
                <option value="mått">Mått</option>
                <option value="g">g</option>
                <option value="tsk">tesked</option>
                <option value="msk">matsked</option>
                <option value="cl">cl</option>
                <option value="ml">ml</option>
                <option value="dl">dl</option>
                <option value="l">l</option>
                <option value="st">st</option>
            </select>

            <input class="ingredIngredient" type="text" placeholder="Ingrediens">

            <button type="button" class="removeIngredient">✕</button>
        `;

        document.querySelector("#ingredientList").appendChild(ingredient);

        ingredient.querySelector(".removeIngredient")
            .addEventListener("click", function () {
                ingredient.remove();
            });
    });
}

function addInstruction() {
    let button = document.querySelector("#addInstruction");

    button.addEventListener("click", function () {

        let instruction = document.createElement("div");
        instruction.classList.add("instruction");

        instruction.innerHTML = `
            <input class="instructionInput" type="text" placeholder="Instruktion">

            <button type="button" class="removeInstruction">✕</button>
        `;

        document.querySelector("#instructionList").appendChild(instruction);

        instruction.querySelector(".removeInstruction")
            .addEventListener("click", function () {
                instruction.remove();
            });
    });
}

function previewImage() {
    let input = document.getElementById("recipeImage");
    let image = document.getElementById("previewImage");

    input.addEventListener("change", function () {
        let file = input.files[0];

        if (!file) {
            return;
        }

        image.src = URL.createObjectURL(file);
    });
}

async function init() {
    await getRecipe();

    editServings();
    addIngredient();
    addInstruction();
    previewImage();

    document.querySelector("#recipeForm").addEventListener("submit", updateRecipe);
}

init();