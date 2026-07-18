import { serveDir, serveFile } from "jsr:@std/http/file-server";
import * as favourites from "./routes/favourites.js";
import * as users from "./routes/users.js";
import * as recipes from "./routes/recipes.js";
import * as login from "./routes/login.js";

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

function notFound() {
    return new Response(JSON.stringify({ Error: "Not found" }), {
        headers: jsonHeaders,
        status: 404
    });
}

function badRequest(message) {
    return new Response(JSON.stringify({ Error: `Bad Request, ${message}` }), {
        headers: HEADERS,
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
    let userIdRoute = new URLPattern({ pathname: "/api/users/:id" });
    let recipeIdRoute = new URLPattern({ pathname: "/api/recipe/:id" });

    if (url.pathname.startsWith("/api/")) {

        if (request.method === "GET") {

            if (url.pathname === "/api/profile") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }
                return jsonResponse(user);
            }

            if (url.pathname === "/api/users") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                return jsonResponse(users.getUsers());
            }

            if (url.pathname === "/api/recipes") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                let filters = {
                    country: url.searchParams.get("country"),
                    category: url.searchParams.get("category"),
                    time: url.searchParams.get("time"),
                    dietary: url.searchParams.getAll("dietary"),
                }
                const filteredRecipes = recipes.filterRecipes(filters);

                console.log(filteredRecipes);

                return jsonResponse(filteredRecipes);
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
                if (userFavourites.length === 0) {
                    return notFound();
                }
                return jsonResponse(userFavourites);
            }

            if (url.pathname === "/api/categories") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                return jsonResponse(recipes.getCategories());
            }

            if (url.pathname === "/api/dietaries") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
            }

            if (url.pathname === "/api/profile/recipes") {
                if (!validateJsonAccept(request)) {
                    return notAcceptable();
                }
                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }
                return jsonResponse(recipes.getProfileRecipes(user.id));
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

                let user = login.getProfile(request);
                if (!user) {
                    return unauthorized();
                }

                let allUsers = users.getUsers();
                for (let usr of allUsers) {
                    if (usr.id === user.id) {
                        usr.cookie = "";
                    }
                }
                users.saveUsers(allUsers);

                const response = jsonResponse({ message: "Logout succeeded" });
                response.headers.set(
                    "Set-Cookie",
                    "session=deleted; Max-Age=0; HttpOnly; SameSite=Lax; Path=/"
                );

                return response;
            }

            if (url.pathname === "/api/user") {
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
                        return badRequest("Username already exists");
                    }

                    if (usr.email === newUser.email) {
                        return badRequest("Email already exists");
                    }
                }

                if (!newUser.username || !newUser.email || !newUser.password) {
                    return badRequest("Username, email and password are required.");
                }

                return jsonResponse(users.createUser(newUser), 201);
            }

            if (url.pathname === "/api/recipes") {
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

                let newRecipe = await getRequestBody(request);

                if (!newRecipe) {
                    return badRequest("Invalid or missing JSON body.");
                }

                if (!newRecipe.name || !newRecipe.description || !newRecipe.country || !newRecipe.category || !newRecipe.time || !newRecipe.dietary || !newRecipe.ingredients ||
                    !newRecipe.instructions || !newRecipe.imageUrl) {
                    return badRequest("All recipe fields are required.");
                }

                newRecipe.author = user.id;
                return jsonResponse(recipes.createRecipe(newRecipe), 201);

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
        }

        if (request.method === "PATCH") {
            if (url.pathname === "/api/recipes/:id") {
                const recipeIdRoute = new URLPattern({
                    pathname: "/api/recipes/:id"

                });

                const match = recipeIdRoute.exec(url);

                if (match) {
                    const id = Number(match.pathname.groups.id);
                }
            }

            if (url.pathname === "/api/profile") {

            }
        }

        if (request.method === "DELETE") {
            if (url.pathname === "/api/recipes/:id") {
                const recipeIdRoute = new URLPattern({
                    pathname: "/api/recipes/:id"

                });

                const match = recipeIdRoute.exec(url);

                if (match) {
                    const id = Number(match.pathname.groups.id);
                }
            }

            if (url.pathname === "/api/favourites/:id") {
                const favouriteIdRoute = new URLPattern({
                    pathname: "/api/favourites/:id"

                });

                const match = favouriteIdRoute.exec(url);

                if (match) {
                    const id = Number(match.pathname.groups.id);
                }
            }
        }
        return new Response("Not Found", { status: 404 });
    }

    if (url.pathname === "/" || url.pathname === "/login") {
        return serveFile(request, "../public/index.html");
    }
    if (url.pathname === "/register") {
        return serveFile(request, "../public/register.html");
    }
    return serveDir(request, {
        fsRoot: "../public",
        urlRoot: "../public",
        showIndex: true,
    });
}

Deno.serve({ port: 3000 }, handler);