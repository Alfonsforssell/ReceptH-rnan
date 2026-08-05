export function getComments() {
    const text = Deno.readTextFileSync(
        "data/comments.json"
    );
    return JSON.parse(text);
}

export function getCommentById(id) {
    let comments = JSON.parse(Deno.readTextFileSync("data/comments.json"));

    for (let comment of comments) {
        if (comment.id === id) {
            return comment;
        }
    }
    return null;
}

export function getCommentsByRecipe(recipeId) {
    const comments = getComments();
    let matchedComments = [];

    for (let comment of comments) {
        if (comment.recipeId === recipeId) {
            matchedComments.push(comment);
        }
    }
    return matchedComments;
}



export function addComment(recipeId, userId, text, rating) {
    const comments = getComments();

    for (let comment of comments) {
        if (
            comment.recipeId === recipeId &&
            comment.userId === userId
        ) {
            return null;
        }
    }

    let highestId = 0;

    for (let comment of comments) {
        if (comment.id > highestId) {
            highestId = comment.id;
        }
    }

    let newComment = {
        id: highestId + 1,
        userId: userId,
        recipeId: recipeId,
        text: text,
        rating: rating,
        createdAt: new Date().toISOString()
    };

    comments.push(newComment);

    Deno.writeTextFileSync(
        "data/comments.json",
        JSON.stringify(comments, null, 2)
    );

    return newComment;
}



export function updateComment(id, text, rating, userId) {
    const comments = getComments();

    for (let comment of comments) {
        if (comment.id === id) {

            if (comment.userId !== userId) {
                return null;
            }

            comment.text = text;
            comment.rating = rating;

            Deno.writeTextFileSync(
                "data/comments.json",
                JSON.stringify(comments, null, 2)
            );

            return comment;
        }
    }

    return null;
}



export function deleteComment(id, userId) {
    const comments = JSON.parse(
        Deno.readTextFileSync("data/comments.json")
    );

    let newComments = [];
    let deleted = false;

    for (let comment of comments) {
        if (comment.id === id) {

            if (comment.userId !== userId) {
                return false;
            }

            deleted = true;
        }
        else {
            newComments.push(comment);
        }
    }

    if (!deleted) {
        return false;
    }

    Deno.writeTextFileSync(
        "data/comments.json",
        JSON.stringify(newComments, null, 2)
    );

    return true;
}

export function getRating(recipeId) {
    const comments = JSON.parse(
        Deno.readTextFileSync("data/comments.json")
    );

    let total = 0;
    let amount = 0;

    for (let comment of comments) {
        if (comment.recipeId === recipeId) {
            total += comment.rating;
            amount++;
        }
    }

    if (amount === 0) {
        return {
            average: 0,
            amount: 0
        };
    }

    return {
        average: Number((total / amount).toFixed(1)),
        amount: amount
    };
}

export function getUserRating(userId, recipes) {
    const comments = getComments();

    let total = 0;
    let amount = 0;
    for (let recipe of recipes) {
        if (recipe.author === userId) {
            for (let comment of comments) {
                if (comment.recipeId === recipe.id) {
                    total += comment.rating;
                    amount++;
                }
            }
        }
    }
    if (amount === 0) {
        return {
            average: 0,
            amount: 0
        };
    }
    return {
        average: Number((total / amount).toFixed(1)),
        amount: amount
    };

}