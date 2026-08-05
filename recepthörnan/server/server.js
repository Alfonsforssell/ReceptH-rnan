import { serveDir, serveFile } from "jsr:@std/http/file-server";
import * as favourites from "./routes/favourites.js";
import * as users from "./routes/users.js";
import * as recipes from "./routes/recipes.js";
import * as login from "./routes/login.js";
import * as comments from "./routes/comments.js";

function validateJsonContent(request) {
    let content = request.headers.get("Content-Type");
    return content && content.includes("application/json");
}

function validateJsonAccept(request) {
    let accept = request.headers.get("Accept");
    return accept && accept.includes("application/json");
}

function notAcceptable() {
    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
        status: 406,
        headers: jsonHeaders
    });
}

function unsupportedMediaType() {
    return new Response(JSON.stringify({ Error: "Unsupported Media Type" }), {
        headers: jsonHeaders,
        status: 415
    });
}

function unauthorized() {
    return new Response(JSON.stringify({ Error: "Unauthorized" }), {
        headers: jsonHeaders,
        status: 401
    });
}

function notFound(message) {
    return new Response(JSON.stringify({ Error: `Not found. ${message}` }), {
        headers: jsonHeaders,
        status: 404
    });
}

function badRequest(message) {
    return new Response(JSON.stringify({ error: message }), {
        headers: jsonHeaders,
        status: 400
    });
}

async function getRequestBody(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }

}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: jsonHeaders
    });
}

let jsonHeaders = {
    "Content-Type": "application/json",
};

async function handler(request) {
    let url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {

        if (request.method === "GET") {
            if (url.pathname === "/api/users/search") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let username = url.searchParams.get("username");

                if (!username || username.trim() === "") {
                    return jsonResponse([]);
                }

                let results = users.searchUsers(username.trim());
                for (let user of results) {
                    let userRecipes = recipes.getProfileRecipes(user.id);
                    user.recipeCount = userRecipes.length;

                }

                return jsonResponse(results);
            }

            if (url.pathname === "/api/profile") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }
                let userRecipes = recipes.getProfileRecipes(user.id);
                let allRecipes = recipes.getRecipes();

                let totalRecipeViews = users.getTotalRecipeViews(
                    user.id,
                    allRecipes
                );
                let highestRecipeFavouriteCount = recipes.getHighestRecipeFavouriteCount(
                    user.id,
                    allRecipes
                );

                let allComments = comments.getComments();
                user.recipeCount = userRecipes.length;

                let ratingCount = users.getUserRatingCount(
                    user.id,
                    allComments
                );

                let favouriteCount = users.getUserFavouriteCount(user);

                let commentCount = users.getUserCommentCount(
                    user.id,
                    allComments
                );

                let uniqueCountryCount = recipes.getUniqueCountryCount(
                    user.id,
                    allRecipes
                );

                let averageRecipeRating = recipes.getAverageRecipeRating(
                    user.id,
                    allRecipes
                );

                let highestCategoryRecipeCount =
                    recipes.getHighestCategoryRecipeCount(
                        user.id,
                        allRecipes
                    );

                let perfectScore = recipes.hasPerfectScore(
                    user.id,
                    allRecipes,
                    allComments
                );

                user.unlockedTitles = users.getUnlockedTitles(
                    user,
                    user.recipeCount,
                    ratingCount,
                    favouriteCount,
                    commentCount,
                    highestRecipeFavouriteCount,
                    totalRecipeViews,
                    uniqueCountryCount,
                    averageRecipeRating,
                    highestCategoryRecipeCount,
                    perfectScore
                );

                if (!user.selectedTitle) {
                    user.selectedTitle = users.getUserTitle(user);
                }

                if (typeof user.selectedTitle === "object") {
                    user.selectedTitle = user.selectedTitle.name;
                }

                user.title = user.selectedTitle;

                let rating = users.getUserRating(
                    user.id,
                    userRecipes,
                    allComments
                );

                user.averageRating = rating.averageRating;
                user.ratingCount = rating.ratingAmount;

                return jsonResponse(user);
            }

            if (url.pathname === "/api/users") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                return jsonResponse(users.getUsers());
            }

            if (url.pathname === "/api/recipes/search") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let query = url.searchParams.get("q");

                if (!query) {
                    return badRequest("Search query is required.");
                }

                return jsonResponse(recipes.searchRecipes(query));
            }

            const recipeIdRoute = new URLPattern({
                pathname: "/api/recipes/:id"
            });

            const recipeMatch = recipeIdRoute.exec(url);

            if (recipeMatch) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                const id = Number(recipeMatch.pathname.groups.id);

                let recipe = recipes.getRecipeById(id);

                if (!recipe) {

                    return notFound("Recipe does not exist.");

                }

                recipes.addView(id);
                recipe = recipes.getRecipeById(id);
                recipe.favoriteCount = recipes.getFavouriteCount(id);
                let rating = comments.getRating(id);
                recipe.averageRating = rating.average;
                recipe.ratingCount = rating.amount;
                return jsonResponse(recipe);
            }

            if (url.pathname === "/api/recipes") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let filters = {
                    country: url.searchParams.get("country"),
                    category: url.searchParams.get("category"),
                    time: url.searchParams.get("time"),
                    dietary: url.searchParams.getAll("dietary"),
                    favs: url.searchParams.get("favs")
                }
                const filteredRecipes = recipes.filterRecipes(filters);
                let showingRecipes = [];

                for (let recipe of filteredRecipes) {
                    if (Number(recipe.author) === Number(user.id)) {
                        continue;
                    }
                    recipe.isFavourite = user.favourites.includes(recipe.id);
                    recipe.favoriteCount = recipes.getFavouriteCount(recipe.id);

                    let rating = comments.getRating(recipe.id);
                    recipe.averageRating = rating.average;
                    recipe.ratingCount = rating.amount;

                    if (filters.favs === "favorites" && !recipe.isFavourite) {
                        continue;
                    }

                    if (filters.favs === "nonfavorites" && recipe.isFavourite) {
                        continue;
                    }

                    showingRecipes.push(recipe);
                }

                return jsonResponse(showingRecipes);
            }

            if (url.pathname === "/api/favourites") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }
                let userFavourites = favourites.getFavourites(user.id);
                return jsonResponse(userFavourites);
            }

            if (url.pathname === "/api/categories") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                return jsonResponse(recipes.getCategories());
            }

            if (url.pathname === "/api/countries") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                return jsonResponse(recipes.getCountries());
            }

            if (url.pathname === "/api/dietaries") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                return jsonResponse(recipes.getDietaries());
            }

            if (url.pathname === "/api/profile/recipes") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let myRecipes = recipes.getProfileRecipes(user.id);

                for (let recipe of myRecipes) {
                    recipe.favoriteCount = recipes.getFavouriteCount(recipe.id);
                    let rating = comments.getRating(recipe.id);
                    recipe.averageRating = rating.average;
                    recipe.ratingCount = rating.amount;
                }

                return jsonResponse(myRecipes);
            }

            if (url.pathname.startsWith("/api/users/") &&
                url.pathname.endsWith("/recipes")) {

                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let parts = url.pathname.split("/");
                let id = Number(parts[3]);

                if (!Number.isInteger(id)) {
                    return notFound();
                }

                let profileUser = users.getUserById(id);

                if (!profileUser) {
                    return notFound();
                }

                let loggedInUser = login.getProfile(request);

                if (!loggedInUser) {
                    return unauthorized();
                }

                let userRecipes = recipes.getProfileRecipes(id);

                for (let recipe of userRecipes) {
                    recipe.isFavourite =
                        loggedInUser.favourites.includes(recipe.id);

                    recipe.favoriteCount =
                        recipes.getFavouriteCount(recipe.id);

                    let rating =
                        comments.getRating(recipe.id);

                    recipe.averageRating = rating.average;
                    recipe.ratingCount = rating.amount;
                }

                return jsonResponse(userRecipes);
            }

            if (url.pathname.startsWith("/api/users/")) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let id = Number(url.pathname.split("/")[3]);

                if (Number.isNaN(id)) {
                    return notFound();
                }

                let user = users.getPublicUserById(id);

                if (!user) {
                    return notFound();
                }

                return jsonResponse(user);
            }

            if (url.pathname.startsWith("/api/users/")) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let id = Number(url.pathname.split("/")[3]);

                if (!Number.isInteger(id)) {
                    return notFound();
                }

                let user = users.getUserById(id);

                if (!user) {
                    return notFound();
                }

                let publicUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                    favourites: user.favourites
                };

                return jsonResponse(publicUser);
            }

            if (url.pathname.startsWith("/api/users/") &&
                url.pathname.endsWith("/recipes")) {

                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let parts = url.pathname.split("/");
                let id = Number(parts[3]);

                if (Number.isNaN(id)) {
                    return notFound();
                }

                let user = users.getUserById(id);

                if (!user) {
                    return notFound();
                }

                let userRecipes = recipes.getProfileRecipes(user.id);

                for (let recipe of userRecipes) {
                    recipe.favoriteCount = recipes.getFavouriteCount(recipe.id);

                    let rating = comments.getRating(recipe.id);

                    recipe.averageRating = rating.average;
                    recipe.ratingCount = rating.amount;
                }

                return jsonResponse(userRecipes);
            }

            const userRatingRoute = new URLPattern({
                pathname: "/api/ratings/:recipeId/user"
            });

            const userRatingMatch = userRatingRoute.exec(url);
            if (userRatingMatch) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let recipeId = Number(
                    userRatingMatch.pathname.groups.recipeId
                );

                let rating = comments.getUserRating(
                    recipeId,
                    user.id
                );

                return jsonResponse(rating);
            }

            const commentsRoute = new URLPattern({
                pathname: "/api/comments/:recipeId"
            });

            const commentsMatch = commentsRoute.exec(url);
            if (commentsMatch) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let recipeId = Number(
                    commentsMatch.pathname.groups.recipeId
                );

                let recipeComments =
                    comments.getCommentsByRecipe(recipeId);

                return jsonResponse(recipeComments);
            }
        }

        if (request.method === "POST") {
            if (url.pathname === "/api/login") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                const credentials = await getRequestBody(request);
                if (!credentials) {
                    return badRequest("Invalid or missing JSON body.");
                }

                if (!credentials.username || !credentials.password) {
                    return badRequest("Username and password are required.");
                }

                const loggedInUser = login.login(credentials);

                if (!loggedInUser) {
                    return unauthorized();
                }

                const response = jsonResponse(loggedInUser.user);
                response.headers.set(
                    "Set-Cookie",
                    `session=${loggedInUser.sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
                );

                return response;
            }

            if (url.pathname === "/api/logout") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let loggedOut = login.logout(request);
                if (!loggedOut) {
                    return unauthorized();
                }

                const response = jsonResponse({ message: "Logout succeeded" });
                response.headers.set(
                    "Set-Cookie",
                    "session=deleted; Max-Age=0; HttpOnly; SameSite=Lax; Path=/"
                );

                return response;
            }

            if (url.pathname === "/api/users") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                let newUser = await getRequestBody(request);
                if (!newUser) {
                    return badRequest("Invalid or missing JSON body.");
                }

                let allUsers = users.getUsers();

                for (let usr of allUsers) {
                    if (usr.username === newUser.username) {
                        return badRequest("Användarnamnet är upptaget");
                    }

                    if (usr.email === newUser.email) {
                        return badRequest("Angiven mailadress används redan");
                    }
                }

                if (!newUser.username || !newUser.email || !newUser.password) {
                    return badRequest("Username, email and password are required.");
                }

                if (newUser.password !== newUser.repeatPassword) {
                    return badRequest("Repeated password was incorrect");
                }

                return jsonResponse(users.createUser(newUser), 201);
            }

            if (url.pathname === "/api/recipes") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }

                let form = await request.formData();

                let image = form.get("image");

                if (!image) {
                    return badRequest("Image is required.");
                }

                let imageName = crypto.randomUUID() + "." + image.name.split(".").pop();

                await Deno.writeFile(
                    "./public/assets/uploads/" + imageName,
                    new Uint8Array(await image.arrayBuffer())
                );

                let newRecipe = {
                    name: form.get("name"),
                    description: form.get("description"),
                    category: form.get("category"),
                    time: Number(form.get("time")),
                    country: form.get("country"),
                    servings: Number(form.get("servings")),
                    dietary: JSON.parse(form.get("dietary")),
                    ingredients: JSON.parse(form.get("ingredients")),
                    instructions: JSON.parse(form.get("instructions")),
                    imageUrl: "/uploads/" + imageName
                };

                return jsonResponse(recipes.createRecipe(newRecipe, user.id), 201);
            }

            if (url.pathname === "/api/favourites") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                let user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }

                let newFavourite = await getRequestBody(request);
                if (!newFavourite.recipeId) {
                    return badRequest("Recipe ID is required.");
                }

                let updatedFavouritesList = favourites.addFavourite(newFavourite.recipeId, user.id);

                if (!updatedFavouritesList) {
                    return badRequest("Recipe could not be added to favourites.");
                }

                return jsonResponse(updatedFavouritesList);

            }

            if (url.pathname === "/api/comments") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let body = await getRequestBody(request);
                if (!body.recipeId || !body.rating) {
                    return badRequest(
                        "Recipe ID and rating required."
                    );
                }


                let newComment = comments.addComment(
                    body.recipeId,
                    user.id,
                    body.text ?? "",
                    body.rating
                );
                if (!newComment) {
                    return badRequest(
                        "You already reviewed this recipe."
                    );
                }

                return jsonResponse(newComment);
            }
        }

        if (request.method === "PATCH") {
            if (url.pathname === "/api/profile/title") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let body = await request.json();
                if (!body.selectedTitle) {
                    return badRequest("Titel saknas.");
                }

                let updatedUser = users.updateSelectedTitle(
                    user.id,
                    body.selectedTitle
                );

                if (!updatedUser) {
                    return badRequest("Titeln är inte upplåst.");
                }

                return jsonResponse({
                    selectedTitle: updatedUser.selectedTitle
                });
            }

            if (url.pathname === "/api/profile") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                let user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }

                let newUserData = await getRequestBody(request);
                if (!newUserData.username) {
                    return badRequest("Username is required.");
                }
                if (!newUserData.email) {
                    return badRequest("Email is required.");
                }
                if (!newUserData.password) {
                    return badRequest("Password is required.");
                }

                let updatedUser = users.updateUser(user.id, newUserData);

                if (updatedUser === "username") {
                    return badRequest("Username already exists.");
                }

                if (updatedUser === "email") {
                    return badRequest("Email already exists.");
                }

                return jsonResponse(updatedUser);
            }

            const recipeIdRoute = new URLPattern({
                pathname: "/api/recipes/:id"
            });

            if (!validateJsonAccept(request)) {
                return notAcceptable();
            }

            const recipeMatch = recipeIdRoute.exec(url);

            if (recipeMatch) {
                const user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }

                const id = Number(recipeMatch.pathname.groups.id);

                const oldRecipe = recipes.getRecipeById(id);

                if (!oldRecipe) {
                    return badRequest("Recipe not found.");
                }

                const form = await request.formData();

                let image = form.get("image");
                let imageUrl = oldRecipe.imageUrl;

                if (image && image.size > 0) {
                    let imageName =
                        crypto.randomUUID() + "." + image.name.split(".").pop();

                    await Deno.writeFile(
                        "./public/assets/uploads/" + imageName,
                        new Uint8Array(await image.arrayBuffer())
                    );

                    imageUrl = "/uploads/" + imageName;
                }

                const newRecipe = {
                    name: form.get("name"),
                    description: form.get("description"),
                    category: form.get("category"),
                    time: Number(form.get("time")),
                    country: form.get("country"),
                    servings: Number(form.get("servings")),
                    dietary: JSON.parse(form.get("dietary")),
                    ingredients: JSON.parse(form.get("ingredients")),
                    instructions: JSON.parse(form.get("instructions")),
                    imageUrl: imageUrl
                };

                if (
                    !newRecipe.name ||
                    !newRecipe.description ||
                    !newRecipe.country ||
                    !newRecipe.category ||
                    !newRecipe.time ||
                    !newRecipe.dietary ||
                    !newRecipe.ingredients ||
                    !newRecipe.instructions
                ) {
                    return badRequest("All recipe fields are required.");
                }

                const recipeChanged = recipes.updateRecipe(id, newRecipe, user.id);

                if (!recipeChanged) {
                    return badRequest("Recipe not found or you do not own this recipe");
                }

                return jsonResponse(recipeChanged);
            }

            const commentIdRoute = new URLPattern({
                pathname: "/api/comments/:id"
            });

            const commentMatch = commentIdRoute.exec(url);
            if (commentMatch) {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }

                if (!validateJsonContent(request)) {
                    return unsupportedMediaType();
                }

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let id = Number(commentMatch.pathname.groups.id);
                let body = await getRequestBody(request);

                if (!body.text || body.text.trim() === "") {
                    return badRequest("Comment text is required.");
                }
                if (!body.rating) {
                    return badRequest("Rating is required.");
                }

                let updatedComment = comments.updateComment(
                    id,
                    body.text,
                    body.rating,
                    user.id
                );

                if (!updatedComment) {
                    return forbidden("You cannot edit this comment.");
                }

                return jsonResponse(updatedComment);
            }
        }

        if (request.method === "DELETE") {
            const recipeIdRoute = new URLPattern({
                pathname: "/api/recipes/:id"
            });

            const recipeMatch = recipeIdRoute.exec(url);
            if (recipeMatch) {
                const user = login.getProfile(request);

                if (!user) {
                    return unauthorized();
                }

                const id = Number(recipeMatch.pathname.groups.id);
                const recipeDeleted = recipes.removeRecipe(id, user.id);

                if (!recipeDeleted) {
                    return badRequest("Recipe not found or you do not own this recipe");
                }

                return jsonResponse(recipeDeleted);
            }

            const favouriteIdRoute = new URLPattern({
                pathname: "/api/favourites/:id"
            });

            const favouriteMatch = favouriteIdRoute.exec(url);

            if (favouriteMatch) {
                const user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                const id = Number(favouriteMatch.pathname.groups.id);
                const favouriteRemoved = favourites.removeFavourite(id, user.id);

                if (!favouriteRemoved) {
                    return badRequest("Recipe is not marked as favourite");
                }

                return jsonResponse(favouriteRemoved);
            }

            const commentDeleteRoute = new URLPattern({
                pathname: "/api/comments/:id"
            });

            const commentDeleteMatch = commentDeleteRoute.exec(url);
            if (commentDeleteMatch) {
                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let id = Number(
                    commentDeleteMatch.pathname.groups.id
                );

                let deleted = comments.deleteComment(
                    id,
                    user.id
                );
                if (!deleted) {
                    return badRequest(
                        "Could not delete comment."
                    );
                }

                return jsonResponse({
                    message: "Review deleted!"
                });
            }
        }
        return new Response("Not Found", { status: 404 });
    }

    if (url.pathname === "/" || url.pathname === "/login") {
        return serveFile(request, "./public/index.html");
    }
    if (url.pathname === "/register") {
        return serveFile(request, "./public/register.html");
    }
    if (url.pathname === "/home") {
        const user = login.getProfile(request);

        if (!user) {
            return serveFile(request, "./public/error.html");
        }

        const response = await serveFile(request, "./public/home.html");
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

        return response;
    }

    if (url.pathname === "/about") {
        return serveFile(request, "./public/about.html");
    }

    if (url.pathname === "/profile") {
        return serveFile(request, "./public/profile.html");
    }

    let recipePattern = new URLPattern({ pathname: "/recipe/:id" });
    let recipeMatch = recipePattern.exec(url);
    if (recipeMatch) {
        return await serveFile(request, "./public/recipe.html");
    }

    let editRecipePattern = new URLPattern({ pathname: "/edit/recipe/:id" });
    let editRecipeMatch = editRecipePattern.exec(url);
    if (editRecipeMatch) {
        return await serveFile(request, "./public/edit.html");
    }

    if (url.pathname === "/publish") {
        return serveFile(request, "./public/create.html");
    }

    return serveDir(request, {
        fsRoot: "./public",
    });
}

Deno.serve({ port: 3000 }, handler);