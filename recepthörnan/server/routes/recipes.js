export function getRecipes() {
    let text = Deno.readTextFileSync("data/recipes.json");
    let data = JSON.parse(text);
    return data.recipes;
}

export function getRecipeById(id) {
    let allRecipes = getRecipes();
    for (let recipe of allRecipes) {
        if (recipe.id === id) {
            return recipe;
        }
    }
    return null;
}

export function createRecipe(recipe, userId) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    const recipes = data.recipes;

    let highestId = 0;

    for (const recipeData of recipes) {
        if (recipeData.id > highestId) {
            highestId = recipeData.id;
        }
    }

    recipe.id = highestId + 1;
    recipe.author = userId;
    recipe.createdAt = new Date().toISOString();

    data.recipes.push(recipe);

    Deno.writeTextFileSync(
        "data/recipes.json",
        JSON.stringify(data, null, 2)
    );

    return recipe;
}

export function updateRecipe(id, request, userId) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    let recipes = data.recipes;

    let matchedRecipe;

    for (let recipe of recipes) {
        if (recipe.id === id) {
            if (recipe.author === userId) {
                matchedRecipe = recipe;
            }
        }
    }

    if (!matchedRecipe) return false;

    matchedRecipe.name = request.name;
    matchedRecipe.description = request.description;
    matchedRecipe.country = request.country;
    matchedRecipe.category = request.category;
    matchedRecipe.time = request.time;
    matchedRecipe.dietary = request.dietary;
    matchedRecipe.ingredients = request.ingredients;
    matchedRecipe.instructions = request.instructions;
    matchedRecipe.imageUrl = request.imageUrl;

    Deno.writeTextFileSync(
        "data/recipes.json",
        JSON.stringify(data, null, 2)
    );

    return matchedRecipe;
}

export function removeRecipe(recipeId, userId) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    const recipes = data.recipes;
    const remainingRecipes = [];

    let result = false;

    for (const recipe of recipes) {
        if (recipe.id === recipeId) {
            if (recipe.author === userId) {
                result = true;
            } else {
                remainingRecipes.push(recipe);
                result = null;
            }
        } else {
            remainingRecipes.push(recipe);
        }
    }

    if (result === true) {
        data.recipes = remainingRecipes;

        Deno.writeTextFileSync(
            "data/recipes.json",
            JSON.stringify(data, null, 2)
        );
    }

    return result;
}

export function searchRecipes(query) {
    let allRecipes = getRecipes();
    let matchedRecipes = [];
    for (let recipe of allRecipes) {
        if (recipe.name.toLowerCase().includes(query.toLowerCase())
            || recipe.country.toLowerCase().includes(query.toLowerCase())
            || recipe.description.toLowerCase().includes(query.toLowerCase())) {
            matchedRecipes.push(recipe);
        }
    }
    return matchedRecipes;
}

export function getRecipesByCountry(recipes, country) {
    let matchedRecipes = [];
    for (let recipe of recipes) {
        if (recipe.country === country) {
            matchedRecipes.push(recipe);
        }
    }
    return matchedRecipes;
}

export function getRecipesByCategory(recipes, category) {
    let matchedRecipes = [];
    for (let recipe of recipes) {
        if (recipe.category === category) {
            matchedRecipes.push(recipe);
        }
    }
    return matchedRecipes;
}

export function getRecipesByTime(recipes, time) {
    let matchedRecipes = [];
    for (let recipe of recipes) {
        if (recipe.time <= time) {
            matchedRecipes.push(recipe);
        }
    }
    return matchedRecipes;
}

export function getRecipesByDietary(recipes, dietaryId) {
    let matchedRecipes = [];

    for (let id of dietaryId) {
        for (let recipe of recipes) {
            if (recipe.dietary.includes(id) && !matchedRecipes.includes(recipe)) {
                matchedRecipes.push(recipe);
            }
        }
    }

    return matchedRecipes;
}

export function filterRecipes(searchParams) {
    let filteredRecipes = getRecipes();
    let country = searchParams.country;
    let category = searchParams.category;
    let time = searchParams.time;
    let dietary = searchParams.dietary;

    if (country) {
        filteredRecipes = getRecipesByCountry(filteredRecipes, country);
    }

    if (category) {
        filteredRecipes = getRecipesByCategory(filteredRecipes, category);
    }

    if (time) {
        filteredRecipes = getRecipesByTime(filteredRecipes, time);
    }

    if (dietary.length > 0) {
        filteredRecipes = getRecipesByDietary(filteredRecipes, dietary);
    }

    return filteredRecipes;
}

export function getCountries() {
    let allRecipes = getRecipes();
    let allCountries = [];
    for (let recipe of allRecipes) {
        if (allCountries.includes(recipe.country)) continue;
        allCountries.push(recipe.country);
    }
    return allCountries;
}

export function getCategories() {
    let allRecipes = getRecipes();
    let allCategories = [];
    for (let recipe of allRecipes) {
        if (allCategories.includes(recipe.category)) continue;
        allCategories.push(recipe.category);
    }
    return allCategories;
}

export function getDietaries() {
    let allRecipes = getRecipes();
    let allDietaries = [];

    for (let recipe of allRecipes) {
        for (let diet of recipe.dietary) {
            if (allDietaries.includes(diet)) {
                continue;
            }
            allDietaries.push(diet);
        }
    }
    return allDietaries;
}

export function getProfileRecipes(request) {
    let allRecipes = getRecipes();
    let matchedRecipes = [];
    for (let recipe of allRecipes) {
        if (recipe.author === request) {
            matchedRecipes.push(recipe);
        }
    }
    return matchedRecipes;
}