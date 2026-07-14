import * as users from "users.js";
import * as recipes from "recipes.js";

export function getFavorites(request) {
    let allUsers = users.getUsers();
    let allRecipes = recipes.getRecipes;
    let matchedRecipes = [];
    for (let user of allUsers) {
        if (user.id === request) {
            for (let recipe of allRecipes) {
                if (user.favourites.includes(recipe.id)) {
                    matchedRecipes.push(recipe);
                }
            }
        }
    }
    return matchedRecipes;
}

export function addFavorite(recipeId, request) {
    let users = users.getUsers();

    for (let user of users) {
        if (user.id == request) {
            if (!user.favourites) {
                user.favourites = [];
            }

            for (let favorit of user.favourites) {
                if (favorit == recipeId)
                    return user;
            }

            user.favourites.push(recipeId);

            users.saveUsers(users);

            return user;
        }
    }
    return null;
}

export function removeFavorite(recipeId, request) {
    let users = users.getUsers();

    for (let user of users) {
        if (user.id === request) {

            if (!user.favourites) {
                user.favourites = [];
            }

            let newFavs = [];
            for (let fav of user.favourites) {
                if (fav != recipeId) {
                    newFavs.push(fav);
                }
            }
            user.favourites = newFavs;
            users.saveUsers(users);
            return user;
        }
    }
    return null;
}