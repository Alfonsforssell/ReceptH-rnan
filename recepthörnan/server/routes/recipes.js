export function getRecipes() {
    let text = Deno.readTextFileSync("data/recipes.json");
    let data = JSON.parse(text);
    console.log(data.recipes);
    return data;
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

export function createRecipe(request) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    let recipes = data.recipes;

    let highestId = 0;

    for (let recipe of recipes) {
        if (recipe.id > highestId) {
            highestId = recipe.id;
        }
    }

    request.id = highestId + 1;

    data.recipes.push(request);

    Deno.writeTextFileSync(
        "data/recipes.json",
        JSON.stringify(data)
    );

    return request;
}

export function updateRecipe(id, request) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    let recipes = data.recipes;

    let matchedRecipe;

    for (let recipe of recipes) {
        if (recipe.id === id) {
            matchedRecipe = recipe;
        }
    }

    if (!matchedRecipe) return false;

    for (let key in request) {
        matchedRecipe[key] = request[key];
    }

    Deno.writeTextFileSync(
        "data/recipes.json",
        JSON.stringify(data, null, 2)
    );

    return true;
}

export function deleteRecipe(id) {
    const text = Deno.readTextFileSync("data/recipes.json");
    const data = JSON.parse(text);
    let recipes = data.recipes;
    let remainingRecipes = [];

    let found = false;

    for (let recipe of recipes) {
        if (recipe.id === id) {
            found = true;
        } else {
            remainingRecipes.push(recipe);
        }
    }

    data.recipes = remainingRecipes;

    Deno.writeTextFileSync(
        "data/recipes.json",
        JSON.stringify(data, null, 2)
    );

    return found;
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
            if (recipe.dietary.includes(parseInt(id)) && !matchedRecipes.includes(recipe)) {
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

    console.log(searchParams);
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

    console.log("Returnerar:", filteredRecipes);

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
        if (allDietaries.includes(recipe.dietary)) continue;
        allDietaries.push(recipe.dietary);
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