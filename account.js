// ============================================================
// CodeShare - User Account
// File: js/account.js
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCq0_Tj1KeK_YpA-290dEmgLU4nZVwKs3Q",

    authDomain:
        "files-de36d.firebaseapp.com",

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
// ADMIN EMAIL
// ============================================================

const ADMIN_EMAIL = "admin@site.com";


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);

const filesRef =
    ref(database, "github_files");


// ============================================================
// DOM HELPERS
// ============================================================

function getElement(id) {

    return document.getElementById(id);

}


// ============================================================
// ALERT
// ============================================================

function showAlert(message, type = "success") {

    const alertBox =
        getElement("account-alert");

    if (!alertBox) {
        return;
    }

    alertBox.textContent =
        message;

    alertBox.className =
        `account-alert ${type}`;

    alertBox.style.display =
        "block";


    setTimeout(() => {

        alertBox.style.display =
            "none";

    }, 3500);

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Not available";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Not available";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// SHORT UID
// ============================================================

function formatUID(uid) {

    if (!uid) {
        return "Not available";
    }

    if (uid.length <= 20) {
        return uid;
    }

    return (
        uid.substring(0, 10) +
        "..." +
        uid.substring(uid.length - 8)
    );

}


// ============================================================
// UPDATE ACCOUNT UI
// ============================================================

function updateAccountUI(user) {

    if (!user) {
        return;
    }


    const email =
        user.email ||
        "Unknown User";


    // --------------------------------------------------------
    // ADMIN CHECK
    // --------------------------------------------------------

    const isAdmin =
        email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase();


    const role =
        isAdmin
            ? "ADMIN"
            : "USER";


    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    const accountEmail =
        getElement("account-email");

    if (accountEmail) {

        accountEmail.textContent =
            email;

    }


    const emailValue =
        getElement("email-value");

    if (emailValue) {

        emailValue.textContent =
            email;

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const accountRole =
        getElement("account-role");

    if (accountRole) {

        accountRole.textContent =
            isAdmin
                ? "Administrator Account"
                : "Standard User Account";

    }


    const roleValue =
        getElement("role-value");

    if (roleValue) {

        roleValue.textContent =
            role;

    }


    // --------------------------------------------------------
    // CREATED DATE
    // --------------------------------------------------------

    const createdValue =
        getElement("created-value");

    if (createdValue) {

        createdValue.textContent =
            formatDate(
                user.metadata?.creationTime
            );

    }


    // --------------------------------------------------------
    // LAST LOGIN
    // --------------------------------------------------------

    const loginValue =
        getElement("login-value");

    if (loginValue) {

        loginValue.textContent =
            formatDate(
                user.metadata?.lastSignInTime
            );

    }


    // --------------------------------------------------------
    // UID
    // --------------------------------------------------------

    const uidValue =
        getElement("uid-value");

    if (uidValue) {

        uidValue.textContent =
            formatUID(user.uid);

        uidValue.title =
            user.uid;

    }


    // --------------------------------------------------------
    // AUTH STATUS
    // --------------------------------------------------------

    const authValue =
        getElement("auth-value");

    if (authValue) {

        authValue.textContent =
            "VERIFIED";

    }


    // --------------------------------------------------------
    // ACCOUNT STATUS
    // --------------------------------------------------------

    const accountStatus =
        getElement("account-status");

    if (accountStatus) {

        accountStatus.textContent =
            "ONLINE";

    }


    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const sessionStatus =
        getElement("session-status");

    if (sessionStatus) {

        sessionStatus.textContent =
            "ACTIVE";

    }


    // --------------------------------------------------------
    // SECURITY
    // --------------------------------------------------------

    const securityStatus =
        getElement("security-status");

    if (securityStatus) {

        securityStatus.textContent =
            "SECURE";

    }

}


// ============================================================
// LOAD FILE COUNT
// ============================================================

function loadFileCount() {

    const countElement =
        getElement("files-count");


    if (!countElement) {
        return;
    }


    countElement.textContent =
        "...";


    onValue(

        filesRef,

        (snapshot) => {

            const data =
                snapshot.val();


            if (!data) {

                countElement.textContent =
                    "0";

                return;

            }


            const count =
                Object.keys(data).length;


            countElement.textContent =
                String(count);

        },

        (error) => {

            console.error(
                "File count error:",
                error
            );


            countElement.textContent =
                "--";

        },

        {
            onlyOnce: true
        }

    );

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    const logoutButtons = [

        getElement("logout-btn"),

        getElement("logout-action-btn")

    ];


    logoutButtons.forEach(
        button => {

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "LOGGING OUT...";

            }

        }
    );


    try {

        await signOut(auth);


        /*
         * IMPORTANT:
         *
         * Firebase signOut complete hone ke baad
         * index.html par bheja ja raha hai.
         *
         * index.html ko automatically welcome.html
         * par redirect nahi karna chahiye jab user
         * logged-out ho.
         */

        window.location.replace(
            "index.html"
        );

    }

    catch (error) {

        console.error(
            "Logout Error:",
            error
        );


        logoutButtons.forEach(
            button => {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "LOGOUT";

                }

            }
        );


        showAlert(
            "Logout failed. Please try again.",
            "error"
        );

    }

}


// ============================================================
// BACK TO WELCOME
// ============================================================

function goToWelcome() {

    window.location.href =
        "welcome.html";

}


// ============================================================
// GO TO FILES
// ============================================================

function goToFiles() {

    window.location.href =
        "files.html";

}


// ============================================================
// REFRESH ACCOUNT
// ============================================================

function refreshAccount() {

    const button =
        getElement("refresh-btn");


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            "<span>⟳</span> REFRESHING...";

    }


    const user =
        auth.currentUser;


    if (user) {

        updateAccountUI(user);

        loadFileCount();

        showAlert(
            "Account information refreshed.",
            "success"
        );

    }


    setTimeout(() => {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                "<span>🔄</span> REFRESH ACCOUNT";

        }

    }, 700);

}


// ============================================================
// COPY UID
// ============================================================

async function copyUID() {

    const user =
        auth.currentUser;


    if (!user) {

        showAlert(
            "No authenticated user found.",
            "error"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            user.uid
        );


        showAlert(
            "User ID copied to clipboard.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Copy UID Error:",
            error
        );


        showAlert(
            "Unable to copy User ID.",
            "error"
        );

    }

}


// ============================================================
// BUTTON EVENTS
// ============================================================

const backButton =
    getElement("back-btn");


if (backButton) {

    backButton.addEventListener(
        "click",
        goToWelcome
    );

}


const logoutButton =
    getElement("logout-btn");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutUser
    );

}


const logoutActionButton =
    getElement("logout-action-btn");


if (logoutActionButton) {

    logoutActionButton.addEventListener(
        "click",
        logoutUser
    );

}


const filesButton =
    getElement("files-btn");


if (filesButton) {

    filesButton.addEventListener(
        "click",
        goToFiles
    );

}


const refreshButton =
    getElement("refresh-btn");


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        refreshAccount
    );

}


const copyUIDButton =
    getElement("copy-uid-btn");


if (copyUIDButton) {

    copyUIDButton.addEventListener(
        "click",
        copyUID
    );

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(

    auth,

    (user) => {

        if (!user) {

            /*
             * User logged out.
             *
             * Account page cannot be opened
             * without authentication.
             */

            window.location.replace(
                "index.html"
            );

            return;

        }


        console.log(
            "Authenticated user:",
            user.email
        );


        updateAccountUI(user);

        loadFileCount();

    }

);


// ============================================================
// DEBUG
// ============================================================

console.log(
    "CodeShare account.js loaded successfully."
);