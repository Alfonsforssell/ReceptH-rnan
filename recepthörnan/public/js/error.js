async function createUser() {
    let btn = document.querySelector("#signUp");
    btn.addEventListener("click", function (e) {
        window.location.href = "/register";
    })

}

function login() {
    let btn = document.querySelector("#login");
    btn.addEventListener("click", function (e) {
        window.location.href = "/login";
    })
}

function reload() {
    if (!sessionStorage.getItem("reloaded")) {
        sessionStorage.setItem("reloaded", "true");
        window.location.reload();
    } else {
        sessionStorage.removeItem("reloaded");
    }
}

login()
createUser();
reload();