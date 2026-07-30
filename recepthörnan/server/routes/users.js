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