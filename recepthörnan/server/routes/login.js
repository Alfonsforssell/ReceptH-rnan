import * as users from "./users.js";

export function login(credentials) {
    const allUsers = users.getUsers();
    let matchedUser = null;

    for (const user of allUsers) {
        if (user.username === credentials.username && user.password === credentials.password) {
            matchedUser = user;
            break;
        }
    }

    if (!matchedUser) {
        return null;
    }

    const session = crypto.randomUUID();
    matchedUser.sessionId = session;
    users.saveUsers(allUsers);

    const user = { ...matchedUser };
    delete user.password;
    delete user.sessionId;

    return {
        user,
        sessionId: session
    };
}

export function logout(request) {
    let user = getProfile(request);

    if (user) {
        let allUsers = users.getUsers();
        for (let usr of allUsers) {
            if (usr.id === user.id) {
                usr.sessionId = null;
            }
        }
        users.saveUsers(allUsers);
        return true
    }
    return false
}

export function getProfile(request) {
    let cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
        return null;
    }

    let allUsers = users.getUsers();

    for (let user of allUsers) {
        if (cookieHeader.includes(user.sessionId)) {
            return user;
        }
    }
    return null;
}
