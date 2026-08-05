import * as recipes from "./recipes.js";
import * as comments from "./comments.js";


export function getUsers() {
    let text = Deno.readTextFileSync("data/users.json");
    let data = JSON.parse(text);
    return data;
}

export function getUserById(id) {
    let allUsers = getUsers();
    for (let user of allUsers) {
        if (id === user.id) {
            return user;
        }
    }
    return null;
}

export function getHighestId() {
    let users = getUsers();
    let max = 1;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id > max) {
            max = users[i].id;
        }
    }
    return max;
}

export function saveUsers(users) {
    Deno.writeTextFileSync(
        "data/users.json",
        JSON.stringify(users, null, 2)
    );
}

export function createUser(request) {
    let allUsers = getUsers();
    let highestId = getHighestId();
    request.id = parseInt(highestId + 1);
    request.sessionId = null;
    request.favourites = [];
    request.createdAt = new Date().toISOString();
    request.selectedTitle = null;
    delete request.repeatPassword;
    allUsers.push(request);
    let stringifiedData = JSON.stringify(allUsers);
    Deno.writeTextFileSync("data/users.json", stringifiedData);
    return request;
}

export function updateUser(id, request) {
    const allUsers = getUsers();
    for (const otherUser of allUsers) {
        if (
            otherUser.id !== id &&
            otherUser.username.toLowerCase() === request.username.toLowerCase()
        ) {
            return "username";
        }

        if (
            otherUser.id !== id &&
            otherUser.email.toLowerCase() === request.email.toLowerCase()
        ) {
            return "email";
        }
    }

    for (const user of allUsers) {
        if (user.id === id) {
            user.username = request.username;
            user.email = request.email;

            if (request.password) {
                user.password = request.password;
            }

            Deno.writeTextFileSync(
                "data/users.json",
                JSON.stringify(allUsers, null, 2)
            );

            return user;
        }
    }
    return null;
}

export function updateSelectedTitle(id, selectedTitle) {
    const allUsers = getUsers();

    for (let user of allUsers) {
        if (user.id === id) {

            let userRecipes = recipes.getRecipes();
            let allComments = comments.getComments();

            // ANTAL EGNA RECEPT
            let recipeCount = 0;

            for (let recipe of userRecipes) {
                if (Number(recipe.author) === Number(id)) {
                    recipeCount++;
                }
            }


            // ANTAL BETYG SOM ANVÄNDAREN HAR GETT
            let ratingCount = 0;

            for (let comment of allComments) {
                if (
                    Number(comment.userId) === Number(id) &&
                    comment.rating !== null &&
                    comment.rating !== undefined
                ) {
                    ratingCount++;
                }
            }


            // ANTAL FAVORITER
            let favouriteCount = user.favourites.length;


            // ANTAL KOMMENTARER
            let commentCount = 0;

            for (let comment of allComments) {
                if (
                    Number(comment.userId) === Number(id) &&
                    comment.text &&
                    comment.text.trim() !== ""
                ) {
                    commentCount++;
                }
            }


            // HÖGSTA ANTAL FAVORITER PÅ ETT EGET RECEPT
            let highestRecipeFavouriteCount = 0;

            for (let recipe of userRecipes) {
                if (Number(recipe.author) === Number(id)) {

                    let favouriteCountForRecipe =
                        recipe.favoriteCount || 0;

                    if (
                        favouriteCountForRecipe >
                        highestRecipeFavouriteCount
                    ) {
                        highestRecipeFavouriteCount =
                            favouriteCountForRecipe;
                    }
                }
            }


            // TOTALA VISNINGAR PÅ EGNA RECEPT
            let totalRecipeViews = 0;

            for (let recipe of userRecipes) {
                if (Number(recipe.author) === Number(id)) {
                    totalRecipeViews += recipe.views || 0;
                }
            }


            // ANTAL UNIKA LÄNDER
            let countries = [];

            for (let recipe of userRecipes) {
                if (
                    Number(recipe.author) === Number(id) &&
                    recipe.country &&
                    !countries.includes(recipe.country)
                ) {
                    countries.push(recipe.country);
                }
            }

            let uniqueCountryCount = countries.length;


            // GENOMSNITTLIGT BETYG PÅ EGNA RECEPT
            let totalRating = 0;
            let ratingAmount = 0;

            for (let recipe of userRecipes) {

                if (Number(recipe.author) === Number(id)) {

                    for (let comment of allComments) {

                        if (
                            comment.recipeId === recipe.id &&
                            comment.rating !== null &&
                            comment.rating !== undefined
                        ) {
                            totalRating += Number(comment.rating);
                            ratingAmount++;
                        }
                    }
                }
            }

            let averageRecipeRating = 0;

            if (ratingAmount > 0) {
                averageRecipeRating =
                    totalRating / ratingAmount;
            }


            // FLEST RECEPT I SAMMA KATEGORI
            let categoryCounts = {};

            for (let recipe of userRecipes) {

                if (
                    Number(recipe.author) === Number(id) &&
                    recipe.category
                ) {

                    if (!categoryCounts[recipe.category]) {
                        categoryCounts[recipe.category] = 0;
                    }

                    categoryCounts[recipe.category]++;
                }
            }

            let highestCategoryRecipeCount = {
                category: "",
                count: 0
            };

            for (let category in categoryCounts) {

                if (
                    categoryCounts[category] >
                    highestCategoryRecipeCount.count
                ) {
                    highestCategoryRecipeCount = {
                        category: category,
                        count: categoryCounts[category]
                    };
                }
            }


            // HÄMTA ALLA UPPLÅSTA TITLAR
            let unlockedTitles = getUnlockedTitles(
                user,
                recipeCount,
                ratingCount,
                favouriteCount,
                commentCount,
                highestRecipeFavouriteCount,
                totalRecipeViews,
                uniqueCountryCount,
                averageRecipeRating,
                highestCategoryRecipeCount
            );


            // KONTROLLERA ATT TITELN ÄR UPPLÅST
            let titleExists = unlockedTitles.some(function (title) {
                return title.name === selectedTitle;
            });

            if (!titleExists) {
                return null;
            }


            // SPARA VALD TITEL
            user.selectedTitle = selectedTitle;

            Deno.writeTextFileSync(
                "data/users.json",
                JSON.stringify(allUsers, null, 2)
            );

            return user;
        }
    }

    return null;
}

export function deleteUser(id) {
    const allUsers = getUsers();

    for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i].id === id) {
            allUsers.splice(i, 1);
            Deno.writeTextFileSync(
                "data/users.json",
                JSON.stringify(allUsers, null, 2)
            );

            return true;
        }
    }
    return false;
}

export function getUserTitle(user) {

    let level = user.level;
    let interests = user.interests || [];

    // NEVER
    if (level === "never" && interests.includes("learn")) {
        return "Matlärling";
    }

    if (level === "never" && interests.includes("inspiration")) {
        return "Matsökare";
    }

    if (level === "never" && interests.includes("share")) {
        return "Blivande receptskapare";
    }

    if (level === "never" && interests.includes("discover")) {
        return "Matupptäckare";
    }

    if (level === "never" && interests.includes("techniques")) {
        return "Nyfiken matlagare";
    }

    if (level === "never" && interests.includes("healthy")) {
        return "Hälsosam nybörjare";
    }

    if (level === "never" && interests.includes("culture")) {
        return "Matutforskare";
    }


    // BEGINNER
    if (level === "beginner" && interests.includes("learn")) {
        return "Matlärling";
    }

    if (level === "beginner" && interests.includes("inspiration")) {
        return "Inspirationssökare";
    }

    if (level === "beginner" && interests.includes("share")) {
        return "Nybörjande receptskapare";
    }

    if (level === "beginner" && interests.includes("discover")) {
        return "Matupptäckare";
    }

    if (level === "beginner" && interests.includes("techniques")) {
        return "Tekniklärling";
    }

    if (level === "beginner" && interests.includes("healthy")) {
        return "Hälsomedveten matlagare";
    }

    if (level === "beginner" && interests.includes("culture")) {
        return "Kulturutforskare";
    }


    // AMATEUR
    if (level === "amateur" && interests.includes("learn")) {
        return "Matentusiast under utveckling";
    }

    if (level === "amateur" && interests.includes("inspiration")) {
        return "Matsökare";
    }

    if (level === "amateur" && interests.includes("share")) {
        return "Receptskapare";
    }

    if (level === "amateur" && interests.includes("discover")) {
        return "Matupptäckare";
    }

    if (level === "amateur" && interests.includes("techniques")) {
        return "Teknikentusiast";
    }

    if (level === "amateur" && interests.includes("healthy")) {
        return "Hälsomedveten matlagare";
    }

    if (level === "amateur" && interests.includes("culture")) {
        return "Matkulturentusiast";
    }


    // ENTHUSIAST
    if (level === "enthusiast" && interests.includes("learn")) {
        return "Mästarlärling";
    }

    if (level === "enthusiast" && interests.includes("inspiration")) {
        return "Matentusiast";
    }

    if (level === "enthusiast" && interests.includes("share")) {
        return "Passionerad receptskapare";
    }

    if (level === "enthusiast" && interests.includes("discover")) {
        return "Matupptäckare";
    }

    if (level === "enthusiast" && interests.includes("techniques")) {
        return "Teknikentusiast";
    }

    if (level === "enthusiast" && interests.includes("healthy")) {
        return "Hälsomatentusiast";
    }

    if (level === "enthusiast" && interests.includes("culture")) {
        return "Kulinarisk utforskare";
    }


    // PROFESSIONAL
    if (level === "professional" && interests.includes("learn")) {
        return "Professionell matlärling";
    }

    if (level === "professional" && interests.includes("inspiration")) {
        return "Professionell matskapare";
    }

    if (level === "professional" && interests.includes("share")) {
        return "Professionell receptskapare";
    }

    if (level === "professional" && interests.includes("discover")) {
        return "Kulinarisk upptäckare";
    }

    if (level === "professional" && interests.includes("techniques")) {
        return "Kulinarisk specialist";
    }

    if (level === "professional" && interests.includes("healthy")) {
        return "Professionell hälsokock";
    }

    if (level === "professional" && interests.includes("culture")) {
        return "Kulinarisk kulturambassadör";
    }


    // RESTAURATEUR
    if (level === "restaurateur" && interests.includes("learn")) {
        return "Kulinarisk mentor";
    }

    if (level === "restaurateur" && interests.includes("inspiration")) {
        return "Kulinarisk inspiratör";
    }

    if (level === "restaurateur" && interests.includes("share")) {
        return "Receptmästare";
    }

    if (level === "restaurateur" && interests.includes("discover")) {
        return "Kulinarisk upptäckare";
    }

    if (level === "restaurateur" && interests.includes("techniques")) {
        return "Kulinarisk expert";
    }

    if (level === "restaurateur" && interests.includes("healthy")) {
        return "Hälsokock";
    }

    if (level === "restaurateur" && interests.includes("culture")) {
        return "Matkulturambassadör";
    }


    // CHEF
    if (level === "chef" && interests.includes("learn")) {
        return "Köksmästare";
    }

    if (level === "chef" && interests.includes("inspiration")) {
        return "Kulinarisk inspiratör";
    }

    if (level === "chef" && interests.includes("share")) {
        return "Receptmästare";
    }

    if (level === "chef" && interests.includes("discover")) {
        return "Kulinarisk upptäckare";
    }

    if (level === "chef" && interests.includes("techniques")) {
        return "Köksmästare";
    }

    if (level === "chef" && interests.includes("healthy")) {
        return "Hälsokock";
    }

    if (level === "chef" && interests.includes("culture")) {
        return "Kulinarisk kulturmästare";
    }


    // MICHELIN
    if (level === "michelin" && interests.includes("learn")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("inspiration")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("share")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("discover")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("techniques")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("healthy")) {
        return "Kulinarisk mästare";
    }

    if (level === "michelin" && interests.includes("culture")) {
        return "Kulinarisk mästare";
    }


    return "Matälskare";
}

export function getUserRatingCount(userId, comments) {
    let ratingCount = 0;

    for (let comment of comments) {
        if (
            comment.userId === userId &&
            comment.rating !== null &&
            comment.rating !== undefined
        ) {
            ratingCount++;
        }
    }

    return ratingCount;
}

export function getUserFavouriteCount(user) {
    return user.favourites.length;
}

export function getUserCommentCount(userId, comments) {
    let commentCount = 0;

    for (let comment of comments) {
        if (
            comment.userId === userId &&
            comment.text &&
            comment.text.trim() !== ""
        ) {
            commentCount++;
        }
    }

    return commentCount;
}

export function getTotalRecipeViews(userId, allRecipes) {
    let totalViews = 0;

    for (let recipe of allRecipes) {
        if (Number(recipe.author) === Number(userId)) {
            totalViews += recipe.views || 0;
        }
    }

    return totalViews;
}

export function translateRarity(rarity) {
    if (rarity === "common") {
        return "Vanlig";
    }

    if (rarity === "uncommon") {
        return "Ovanlig";
    }

    if (rarity === "rare") {
        return "Sällsynt";
    }

    if (rarity === "epic") {
        return "Episk";
    }

    if (rarity === "legendary") {
        return "Legendarisk";
    }

    return rarity;
}

export function getUnlockedTitles(
    user,
    recipeCount,
    ratingCount = 0,
    favouriteCount = 0,
    commentCount = 0,
    highestRecipeFavouriteCount = 0,
    totalRecipeViews = 0,
    uniqueCountryCount = 0,
    averageRecipeRating = 0,
    highestCategoryRecipeCount = {
        count: 0,
        category: ""
    },
    perfectScore = false
) {

    let titles = [];

    // Bastitel
    let baseTitle = getUserTitle(user);

    titles.push({
        name: baseTitle,
        rarity: "common"
    });


    // RECEPT
    if (recipeCount >= 5) {
        titles.push({
            name: "Aktiv receptskapare",
            rarity: "common"
        });
    }

    if (recipeCount >= 10) {
        titles.push({
            name: "Erfaren receptskapare",
            rarity: "uncommon"
        });
    }

    if (recipeCount >= 25) {
        titles.push({
            name: "Mästerlig receptskapare",
            rarity: "rare"
        });
    }

    if (recipeCount >= 50) {
        titles.push({
            name: "Legendarisk receptmästare",
            rarity: "legendary"
        });
    }


    // BETYG
    if (ratingCount >= 5) {
        titles.push({
            name: "Flitig betygsättare",
            rarity: "common"
        });
    }

    if (ratingCount >= 25) {
        titles.push({
            name: "Matkritiker",
            rarity: "uncommon"
        });
    }

    if (ratingCount >= 50) {
        titles.push({
            name: "Smakexpert",
            rarity: "rare"
        });
    }

    if (ratingCount >= 100) {
        titles.push({
            name: "Mästerkritiker",
            rarity: "epic"
        });
    }


    // FAVORITER
    if (favouriteCount >= 5) {
        titles.push({
            name: "Favoritsamlare",
            rarity: "common"
        });
    }

    if (favouriteCount >= 25) {
        titles.push({
            name: "Smaksamlare",
            rarity: "uncommon"
        });
    }

    if (favouriteCount >= 50) {
        titles.push({
            name: "Favoritjägare",
            rarity: "rare"
        });
    }

    if (favouriteCount >= 100) {
        titles.push({
            name: "Mästerlig favoritsamlare",
            rarity: "epic"
        });
    }


    // KOMMENTARER
    if (commentCount >= 5) {
        titles.push({
            name: "Matpratare",
            rarity: "common"
        });
    }

    if (commentCount >= 25) {
        titles.push({
            name: "Matdiskutör",
            rarity: "uncommon"
        });
    }

    if (commentCount >= 50) {
        titles.push({
            name: "Kulinarisk rådgivare",
            rarity: "rare"
        });
    }

    if (commentCount >= 100) {
        titles.push({
            name: "Mästerlig matpratare",
            rarity: "epic"
        });
    }


    // RECEPTETS FAVORITER
    if (highestRecipeFavouriteCount >= 5) {
        titles.push({
            name: "Publikfavorit",
            rarity: "common"
        });
    }

    if (highestRecipeFavouriteCount >= 10) {
        titles.push({
            name: "Omtyckt receptskapare",
            rarity: "uncommon"
        });
    }

    if (highestRecipeFavouriteCount >= 25) {
        titles.push({
            name: "Favoritkock",
            rarity: "rare"
        });
    }

    if (highestRecipeFavouriteCount >= 50) {
        titles.push({
            name: "Folkkär receptmästare",
            rarity: "legendary"
        });
    }


    // VISNINGAR
    if (totalRecipeViews >= 100) {
        titles.push({
            name: "Uppmärksammad receptskapare",
            rarity: "common"
        });
    }

    if (totalRecipeViews >= 500) {
        titles.push({
            name: "Populär receptskapare",
            rarity: "uncommon"
        });
    }

    if (totalRecipeViews >= 1000) {
        titles.push({
            name: "Matprofil",
            rarity: "rare"
        });
    }

    if (totalRecipeViews >= 10000) {
        titles.push({
            name: "Receptkändis",
            rarity: "legendary"
        });
    }


    // OLIKA LÄNDER
    if (uniqueCountryCount >= 3) {
        titles.push({
            name: "Matvärldsresenär",
            rarity: "common"
        });
    }

    if (uniqueCountryCount >= 5) {
        titles.push({
            name: "Kulinarisk upptäckare",
            rarity: "uncommon"
        });
    }

    if (uniqueCountryCount >= 10) {
        titles.push({
            name: "Global matutforskare",
            rarity: "rare"
        });
    }

    if (uniqueCountryCount >= 20) {
        titles.push({
            name: "Matkulturmästare",
            rarity: "legendary"
        });
    }


    // HÖGSTA BETYG PÅ EGET RECEPT
    if (averageRecipeRating >= 4.0) {
        titles.push({
            name: "Uppskattad kock",
            rarity: "uncommon"
        });
    }

    if (averageRecipeRating >= 4.5) {
        titles.push({
            name: "Femstjärnig kock",
            rarity: "rare"
        });
    }

    if (averageRecipeRating >= 4.8) {
        titles.push({
            name: "Mästerkock",
            rarity: "epic"
        });
    }


    // RECEPT INOM SAMMA KATEGORI
    if (highestCategoryRecipeCount.count >= 5) {
        titles.push({
            name:
                "Kategorikännare – " +
                highestCategoryRecipeCount.category,
            rarity: "common"
        });
    }

    if (highestCategoryRecipeCount.count >= 10) {
        titles.push({
            name:
                "Specialist – " +
                highestCategoryRecipeCount.category,
            rarity: "uncommon"
        });
    }

    if (highestCategoryRecipeCount.count >= 25) {
        titles.push({
            name:
                "Kategorimästare – " +
                highestCategoryRecipeCount.category,
            rarity: "epic"
        });
    }


    // PERFECT SCORE
    if (perfectScore) {
        titles.push({
            name: "Perfect Score",
            rarity: "legendary"
        });
    }

    return titles;
}

export function getPublicUserById(id) {
    let user = getUserById(id);

    if (!user) {
        return null;
    }

    let allRecipes = recipes.getRecipes();

    let recipeCount = allRecipes.filter(function (recipe) {
        return recipe.author === user.id;
    }).length;

    let rating = comments.getUserRating(user.id, allRecipes);

    return {
        id: user.id,
        username: user.username,
        favourites: user.favourites,
        createdAt: user.createdAt,
        level: user.level,
        interests: user.interests,
        title: typeof user.selectedTitle === "object"
            ? user.selectedTitle.name
            : user.selectedTitle || getUserTitle(user),

        selectedTitle: typeof user.selectedTitle === "object"
            ? user.selectedTitle.name
            : user.selectedTitle || getUserTitle(user),
        recipeCount: recipeCount,
        unlockedTitles: getUnlockedTitles(user, recipeCount),
        averageRating: rating.average,
        ratingCount: rating.amount
    };
}

export function searchUsers(username) {
    let allUsers = getUsers();
    let results = [];

    for (let user of allUsers) {
        if (
            user.username
                .toLowerCase()
                .includes(username.toLowerCase())
        ) {
            results.push({
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
                favouriteCount: user.favourites.length
            });
        }
    }
    return results;

}

export function getUserRating(userId, recipes, comments) {
    let totalRating = 0;
    let ratingAmount = 0;

    for (let recipe of recipes) {
        if (recipe.author === userId) {
            for (let comment of comments) {
                if (comment.recipeId === recipe.id) {
                    totalRating += comment.rating;
                    ratingAmount++;
                }
            }
        }
    }

    if (ratingAmount === 0) {
        return {
            averageRating: 0,
            ratingAmount: 0
        };
    }

    return {
        averageRating: Number((totalRating / ratingAmount).toFixed(1)),
        ratingAmount: ratingAmount
    };
}