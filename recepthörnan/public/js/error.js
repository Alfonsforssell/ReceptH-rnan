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

login()
createUser();