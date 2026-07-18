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

export function saveUsers(request) {
    Deno.writeTextFileSync("data/users.json", JSON.stringify(request));
}

export function createUser(request) {
    let allUsers = getUsers();
    let highestId = getHighestId();
    request.id = parseInt(highestId + 1);
    allUsers.push(request);
    let stringifiedData = JSON.stringify(allUsers);
    Deno.writeTextFileSync("data/users.json", stringifiedData);
}

export function updateUser(id, request) {
    let allUsers = getUsers();
    for (let user of allUsers) {
        if (id === user.id) {
            user = request;
            let stringifiedData = JSON.stringify(allUsers);
            Deno.writeTextFileSync("data/users.json", stringifiedData);
        }
    }
}

export function deleteUser(id) {
    let allUsers = getUsers();
    for (let user of allUsers) {
        if (id === user.id) {
            allUsers.remove(user);
            let stringifiedData = JSON.stringify(allUsers);
            Deno.writeTextFileSync("data/users.json", stringifiedData);
        }
    }
}