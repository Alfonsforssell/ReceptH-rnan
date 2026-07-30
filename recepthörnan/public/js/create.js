import * as api from "./api.js";

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

async function createRecipe() {
    let form = document.getElementById("recipeForm");

    let servings = Number(document.querySelector(".servings").textContent.split(" ")[0]);

    let formData = new FormData();
    formData.append("name", form.name.value);
    formData.append("description", form.description.value);
    formData.append("category", form.category.value);
    formData.append("time", parseFloat(form.time.value));
    formData.append("country", form.country.value);
    formData.append("servings", servings);
    let image = document.getElementById("recipeImage").files[0];

    if (image) {
        formData.append("image", image);
    }

    let dietary = [];
    let checkboxes = document.querySelectorAll("#diets input:checked");
    for (let box of checkboxes) {
        dietary.push(box.value);
    }

    let ingredients = [];
    let ingredientRows = document.querySelectorAll(".ingred");
    for (let ingred of ingredientRows) {
        ingredients.push({
            amount: parseFloat(ingred.querySelector(".ingredAmount").value),
            unit: ingred.querySelector(".ingredType").value,
            name: ingred.querySelector(".ingredIngredient").value
        });
    }

    let instructions = [];
    let instructionInputs = document.querySelectorAll(".instructionInput");
    for (let input of instructionInputs) {
        instructions.push(input.value);
    }

    formData.append("dietary", JSON.stringify(dietary));
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("instructions", JSON.stringify(instructions));


    await api.postRequest("/api/recipes", formData, true);
}

function publishRecipe() {
    let form = document.getElementById("recipeForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        try {
            await createRecipe();
            location.href = "/home";
        } catch (error) {
            console.log(error);
        }
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

editServings();
addIngredient();
addInstruction();
publishRecipe();
previewImage();