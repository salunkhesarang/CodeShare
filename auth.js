// ============================================================
// CodeShare Authentication
// File: js/auth.js
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyCq0_Tj1KeK_YpA-290dEmgLU4nZVwKs3Q",

    authDomain: "files-de36d.firebaseapp.com",

    databaseURL:
        "https://files-de36d-default-rtdb.firebaseio.com",

    projectId:
        "files-de36d",

    storageBucket:
        "files-de36d.firebasestorage.app",

    messagingSenderId:
        "118963654426",

    appId:
        "1:118963654426:web:9e9cd87928f4f07a50a6a3"
};


// ============================================================
// ADMIN
// ============================================================

const ADMIN_EMAIL = "admin@site.com";


// ============================================================
// INITIALIZE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// ============================================================
// DOM
// ============================================================

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const loginBox =
    document.getElementById("login-form");

const registerBox =
    document.getElementById("register-form");

const showRegister =
    document.getElementById("show-register");

const showLogin =
    document.getElementById("show-login");


// ============================================================
// ALERT
// ============================================================

function showAlert(message, type = "error") {

    const box =
        document.getElementById("auth-alert");

    if (!box) return;

    box.textContent = message;

    box.className =
        "alert-box " + type;

    box.style.display = "block";
}


function hideAlert() {

    const box =
        document.getElementById("auth-alert");

    if (!box) return;

    box.style.display = "none";

    box.textContent = "";
}


// ============================================================
// AUTH SCREEN
// ============================================================

function showLoginForm() {

    hideAlert();

    if (loginBox) {
        loginBox.style.display = "block";
    }

    if (registerBox) {
        registerBox.style.display = "none";
    }

}


function showRegisterForm() {

    hideAlert();

    if (loginBox) {
        loginBox.style.display = "none";
    }

    if (registerBox) {
        registerBox.style.display = "block";
    }

}


// ============================================================
// REGISTER / LOGIN SWITCH
// ============================================================

if (showRegister) {

    showRegister.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            showRegisterForm();

        }
    );

}


if (showLogin) {

    showLogin.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            showLoginForm();

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            hideAlert();


            const email =
                document
                    .getElementById("login-email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("login-pass")
                    .value;


            const button =
                document
                    .getElementById("login-btn");


            if (!email || !password) {

                showAlert(
                    "Email aur password enter karein."
                );

                return;

            }


            try {

                button.disabled = true;

                button.textContent =
                    "LOGGING IN...";


                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                console.log(
                    "Login successful:",
                    user.email
                );


                // =================================================
                // ADMIN
                // =================================================

                if (
                    user.email
                        .toLowerCase() ===
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    window.location.href =
                        "admin.html";

                }

                // =================================================
                // NORMAL USER
                // =================================================

                else {

                    window.location.href =
                        "welcome.html";

                }


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                button.disabled = false;

                button.textContent =
                    "LOGIN";


                showAlert(
                    getAuthErrorMessage(
                        error.code
                    ),
                    "error"
                );

            }

        }
    );

}


// ============================================================
// REGISTER
// ============================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            hideAlert();


            const email =
                document
                    .getElementById("reg-email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("reg-pass")
                    .value;


            const button =
                document
                    .getElementById("reg-btn");


            if (!email || !password) {

                showAlert(
                    "Email aur password enter karein."
                );

                return;

            }


            if (password.length < 6) {

                showAlert(
                    "Password minimum 6 characters ka hona chahiye."
                );

                return;

            }


            try {

                button.disabled = true;

                button.textContent =
                    "CREATING ACCOUNT...";


                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Account created:",
                    result.user.email
                );
                
                window.dispatchEvent(
    new CustomEvent(
        "codeshare:new-registration",
        {
            detail: {
                email: result.user.email,
                uid: result.user.uid
            }
        }
    )
);


                showAlert(
                    "Account successfully created!",
                    "success"
                );


                setTimeout(
                    function() {

                        window.location.href =
                            "welcome.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );


                button.disabled = false;

                button.textContent =
                    "REGISTER";


                showAlert(
                    getAuthErrorMessage(
                        error.code
                    ),
                    "error"
                );

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

window.logout =
    async function() {

        try {

            await signOut(auth);

            window.location.replace(
                "index.html"
            );

        } catch (error) {

            console.error(
                "Logout Error:",
                error
            );

        }

    };


// ============================================================
// AUTH STATE
// ============================================================
//
// IMPORTANT:
//
// index.html par Firebase user milne ke baad bhi
// automatic welcome redirect nahi hoga.
//
// ============================================================

onAuthStateChanged(
    auth,
    function(user) {

        console.log(
            "Auth state:",
            user
                ? user.email
                : "Logged out"
        );


        const path =
            window.location.pathname;


        const page =
            path
                .split("/")
                .pop();


        // ================================================
        // INDEX PAGE
        // ================================================

        if (
            page === "index.html" ||
            page === ""
        ) {

            // Do NOTHING.
            //
            // Login page hamesha visible rahega.

            return;

        }


        // ================================================
        // LOGGED OUT
        // ================================================

        if (!user) {

            if (
                page === "welcome.html" ||
                page === "files.html" ||
                page === "admin.html"
            ) {

                window.location.replace(
                    "index.html"
                );

            }

            return;

        }


        // ================================================
        // ADMIN PAGE SECURITY
        // ================================================

        if (page === "admin.html") {

            const isAdmin =
                user.email
                    .toLowerCase() ===
                ADMIN_EMAIL.toLowerCase();


            if (!isAdmin) {

                alert(
                    "Unauthorized Access!"
                );


                window.location.replace(
                    "welcome.html"
                );

            }

        }

    }
);


// ============================================================
// ERROR MESSAGES
// ============================================================

function getAuthErrorMessage(code) {

    switch (code) {

        case "auth/invalid-email":

            return "Email ID ka format incorrect hai.";


        case "auth/user-not-found":

            return "Is email se koi account nahi mila.";


        case "auth/wrong-password":

            return "Password incorrect hai.";


        case "auth/invalid-credential":

            return "Email ya password incorrect hai.";


        case "auth/email-already-in-use":

            return "Ye email already registered hai.";


        case "auth/weak-password":

            return "Password minimum 6 characters ka hona chahiye.";


        case "auth/too-many-requests":

            return "Bahut zyada attempts hue hain. Thodi der baad try karein.";


        case "auth/network-request-failed":

            return "Internet connection check karein.";


        case "auth/operation-not-allowed":

            return "Firebase Console me Email/Password Authentication enable karein.";


        case "auth/unauthorized-domain":

            return "Current domain Firebase Authentication me authorized nahi hai.";


        default:

            return "Authentication error: " + code;

    }

}


console.log(
    "CodeShare auth.js loaded successfully."
);