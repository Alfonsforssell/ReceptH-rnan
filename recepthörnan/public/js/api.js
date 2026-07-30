export async function getRequest(url, credentials = false) {
    let response;
    try {
        let options = {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        };

        if (credentials) {
            options.credentials = "include";
        }

        response = await fetch(url, options);

        if (!response.ok) {
            throw new Error("HTTP ERROR: " + response.status);
        }

        return await response.json();
    }
    catch (error) {
        throw new Error("NETWORK ERROR: " + error.message);
    }
}

export async function postRequest(url, body, credentials = false) {
    try {
        let options = {
            method: "POST",
            headers: {
                "Accept": "application/json"
            }
        };

        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        if (credentials) {
            options.credentials = "include";
        }

        let response = await fetch(url, options);

        if (!response.ok) {
            let error = await response.json();
            console.log("Fel från server:", error);
            throw new Error(error.error);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function patchRequest(url, body, credentials = false) {
    try {
        let options = {
            method: "PATCH",
            headers: {
                "Accept": "application/json"
            }
        };

        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        if (credentials) {
            options.credentials = "include";
        }

        let response = await fetch(url, options);

        if (!response.ok) {
            let error = await response.json();
            throw new Error(error.error);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function deleteRequest(url, credentials = false) {
    let response;
    try {
        let options = {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
            },
        };

        if (credentials) {
            options.credentials = "include";
        }

        response = await fetch(url, options);

        if (!response.ok) {
            throw new Error("HTTP ERROR: " + response.status);
        }

        return await response.json();
    }
    catch (error) {
        throw new Error("NETWORK ERROR: " + error.message);
    }
}