import * as users from "users.js";

export function login(request) {
    let allUsers = users.getUsers();
    let matchedUser = null;
    for (let user of allUsers) {
        if (user.username === request.username && user.password === request.password) {
            matchedUser = user;
        }
    }

    if (!matchedUser) {
        return null;
    }

    let sessionId = crypto.randomUUID();
    matchedUser.cookie = sessionId;
    users.saveUsers(allUsers);
}

export function logout(request) {
    let user = getProfile(request);

    if (user) {
        let allUsers = users.getUsers();
        for (let usr of allUsers) {
            if (usr.id === user.id) {
                usr.cookie = null;
            }
        }
        users.saveUsers(allUsers);
    }
}

export function getProfile(request) {
    let cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
        return null;
    }

    let allUsers = users.getUsers();

    for (let user of allUsers) {
        if (cookieHeader.includes(user.cookie)) {
            return user;

        }
    }
    return null;
}
