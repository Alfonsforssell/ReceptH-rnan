import * as users from "./users.js";
import * as recipes from "./recipes.js";

export function getFavourites(userId) {
    let allUsers = users.getUsers();
    let allRecipes = recipes.getRecipes();
    let matchedRecipes = [];
    for (let user of allUsers) {
        if (user.id === userId) {
            for (let recipe of allRecipes) {
                if (user.favourites.includes(recipe.id)) {
                    matchedRecipes.push(recipe);
                }
            }
        }
    }
    return matchedRecipes;
}

export function addFavourite(recipeId, userId) {
    const allUsers = users.getUsers();

    for (const user of allUsers) {
        if (user.id === userId) {

            if (!user.favourites) {
                user.favourites = [];
            }

            for (const favourite of user.favourites) {
                if (favourite === recipeId) {
                    return null;
                }
            }

            const recipe = recipes.getRecipeById(recipeId);
            if (!recipe) {
                return null;
            }

            user.favourites.push(recipeId);
            users.saveUsers(allUsers);

            return user;
        }
    }

    return null;
}

export function removeFavourite(recipeId, userId) {
    const allUsers = users.getUsers();

    for (const user of allUsers) {
        if (user.id === userId) {

            if (!user.favourites) {
                user.favourites = [];
            }

            let removed = false;
            let newFavs = [];

            for (const fav of user.favourites) {
                if (fav === recipeId) {
                    removed = true;
                } else {
                    newFavs.push(fav);
                }
            }

            if (!removed) {
                return null;
            }

            user.favourites = newFavs;
            users.saveUsers(allUsers);

            return user;
        }
    }

    return null;
}