import { serveDir, serveFile } from "jsr:@std/http/file-server";
import * as favourites from "routes/favourites.js";
import * as users from "routes/users.js";
import * as recipes from "routes/recipes.js";
import * as login from "routes/login.js";

function validateJsonContent(request) {
    let content = request.headers.get("Content-Type");
    return content && content.includes("application/json");
}

function validateJsonAccept(request) {
    let accept = request.headers.get("Accept");
    return accept && accept.includes("application/json");
}

const HEADERS = {
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
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }

                let user = login.getProfile(request);

                if (!user) {
                    return new Response(JSON.stringify({ Error: "Unauthorized" }), {
                        headers: HEADERS,
                        status: 401
                    });
                }

                return new Response(JSON.stringify(user), {
                    headers: HEADERS,
                    status: 200
                })
            }
            if (url.pathname === "/api/users") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }

                let allUsers = users.getUsers();

                return new Response(JSON.stringify(allUsers), {
                    status: 200,
                    headers: HEADERS,
                });
            }
            if (url.pathname === "/api/recipes") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }

                let filters = {
                    country: url.searchParams.get("country"),
                    category: url.searchParams.get("category"),
                    time: url.searchParams.get("time"),
                    dietary: url.searchParams.getAll("dietary"),

                }

                let filteredRecipes = recipes.filteredProducts(filters)

                return new Response(JSON.stringify(filteredRecipes), {
                    status: 200,
                    headers: HEADERS,
                });
            }
            if (url.pathname === "/api/favourites") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }

                let profile = login.getProfile(request);
            }
            if (url.pathname === "/api/categories") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }
            }
            if (url.pathname === "/api/dietaries") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }
            }
            if (url.pathname === "/api/profile/recipes") {
                if (!validateJsonAccept(request)) {
                    return new Response(JSON.stringify({ Error: "Not Acceptable" }), {
                        headers: HEADERS,
                        status: 406,
                    });
                }
            }
        }

        if (request.method === "POST") {

        }

        if (request.method === "PATCH") {

        }

        if (request.method === "DELETE") {

        }
        return new Response("Not Found", { status: 404 });
    }

    if (url.pathname == "/") {
        return serveFile(request, "../public/index.html");
    }
    return serveDir(request, {
        fsRoot: "../public",
        urlRoot: "../public",
        showIndex: true,
    });
}

Deno.serve({ port: 3000 }, handler);