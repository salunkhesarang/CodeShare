
// ============================================================
// CodeShare - Security Guard
// File: js/security.js
//
// IMPORTANT:
// This file is an ADD-ON security layer.
// Existing HTML / CSS / JS files do not need to be modified.
// Only add this file using:
//
// <script type="module" src="js/security.js"></script>
//
// Firebase Database Rules remain the REAL security layer.
// ============================================================


// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    getApp,
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCq0_Tj1KeK_YpA-290dEmgLU4nZVwKs3Q",
    authDomain: "files-de36d.firebaseapp.com",
    databaseURL: "https://files-de36d-default-rtdb.firebaseio.com",
    projectId: "files-de36d",
    storageBucket: "files-de36d.firebasestorage.app",
    messagingSenderId: "118963654426",
    appId: "1:118963654426:web:9e9cd87928f4f07a50a6a3"
};


// ============================================================
// ADMIN EMAIL
// ============================================================

const ADMIN_EMAIL = "admin@site.com";


// ============================================================
// INITIALIZE / REUSE FIREBASE APP
// ============================================================
//
// Existing files.js / auth.js may already have initialized
// Firebase.
//
// getApps() prevents:
// "Firebase App named '[DEFAULT]' already exists"
// error.
// ============================================================

let app;

if (getApps().length > 0) {
    app = getApp();
} else {
    app = initializeApp(firebaseConfig);
}


const auth = getAuth(app);


// ============================================================
// PAGE DETECTION
// ============================================================

const currentPath =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


const currentPage =
    currentPath || "index.html";


// ============================================================
// PAGE TYPES
// ============================================================

const PUBLIC_PAGES = [
    "index.html",
    "",
    "contact.html"
];


const LOGIN_PAGE = "index.html";


const AUTHENTICATED_PAGES = [
    "welcome.html",
    "files.html",
    "account.html",
    "admin.html"
];


const ADMIN_ONLY_PAGES = [
    "admin.html"
];


// ============================================================
// SECURITY STATE
// ============================================================

let securityChecked = false;


// ============================================================
// HELPER: IS ADMIN
// ============================================================

function isAdmin(user) {

    if (!user || !user.email) {
        return false;
    }

    return (
        user.email.trim().toLowerCase() ===
        ADMIN_EMAIL.trim().toLowerCase()
    );
}


// ============================================================
// HELPER: REDIRECT
// ============================================================

function redirectTo(page) {

    if (currentPage === page) {
        return;
    }

    window.location.replace(page);
}


// ============================================================
// HELPER: SHOW SECURITY MESSAGE
// ============================================================

function showSecurityMessage(
    title,
    message
) {

    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:#020205;
            color:#c1cbd7;
            font-family:Arial,sans-serif;
            text-align:center;
        ">

            <div style="
                width:100%;
                max-width:480px;
                padding:35px 25px;
                background:#05080f;
                border:1px solid #00ff66;
                box-shadow:
                    0 0 30px rgba(0,255,102,.15);
                border-radius:8px;
            ">

                <div style="
                    font-size:48px;
                    margin-bottom:15px;
                ">
                    🔐
                </div>

                <h2 style="
                    color:#00f0ff;
                    margin-bottom:12px;
                ">
                    ${escapeHTML(title)}
                </h2>

                <p style="
                    line-height:1.6;
                    color:#9aa7b8;
                    margin-bottom:25px;
                ">
                    ${escapeHTML(message)}
                </p>

                <button
                    id="security-home-btn"
                    style="
                        padding:12px 22px;
                        border:1px solid #00ff66;
                        background:transparent;
                        color:#00ff66;
                        cursor:pointer;
                        border-radius:4px;
                        font-weight:bold;
                    "
                >
                    Go To Login
                </button>

            </div>
        </div>
    `;


    const button =
        document.getElementById(
            "security-home-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                redirectTo(LOGIN_PAGE);

            }
        );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// AUTH STATE SECURITY CHECK
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        // ----------------------------------------------------
        // Prevent duplicate processing
        // ----------------------------------------------------

        securityChecked = true;


        // ----------------------------------------------------
        // USER NOT LOGGED IN
        // ----------------------------------------------------

        if (!user) {

            // Public pages are allowed
            if (
                PUBLIC_PAGES.includes(
                    currentPage
                )
            ) {
                return;
            }


            // All protected pages require login
            if (
                AUTHENTICATED_PAGES.includes(
                    currentPage
                )
            ) {

                redirectTo(
                    LOGIN_PAGE
                );

                return;
            }


            return;
        }


        // ----------------------------------------------------
        // USER IS LOGGED IN
        // ----------------------------------------------------

        const admin =
            isAdmin(user);


        // ----------------------------------------------------
        // ADMIN PAGE
        // ----------------------------------------------------

        if (
            ADMIN_ONLY_PAGES.includes(
                currentPage
            )
        ) {

            if (!admin) {

                showSecurityMessage(
                    "Access Denied",
                    "This page is restricted to the CodeShare administrator."
                );

                setTimeout(
                    () => {
                        redirectTo(
                            "welcome.html"
                        );
                    },
                    1200
                );

                return;
            }

            return;
        }


        // ----------------------------------------------------
        // NORMAL AUTHENTICATED PAGES
        // ----------------------------------------------------

        if (
            AUTHENTICATED_PAGES.includes(
                currentPage
            )
        ) {

            return;
        }


        // ----------------------------------------------------
        // INDEX PAGE
        // ----------------------------------------------------
        //
        // IMPORTANT:
        // We intentionally DO NOT redirect a logged-in user
        // away from index.html.
        //
        // This prevents the old problem:
        //
        // index.html -> automatically -> welcome.html
        //
        // User can stay on login page if needed.
        // ----------------------------------------------------

        if (
            currentPage === "index.html" ||
            currentPage === ""
        ) {

            return;
        }
    }
);


// ============================================================
// PROTECT AGAINST BROWSER BACK-FORWARD CACHE
// ============================================================
//
// After logout, browser sometimes restores an old page from
// bfcache. This forces a fresh security check.
// ============================================================

window.addEventListener(
    "pageshow",
    function (event) {

        if (
            event.persisted
        ) {

            window.location.reload();
        }
    }
);


// ============================================================
// PREVENT ACCESS TO PROTECTED PAGE FROM BF CACHE
// ============================================================

window.addEventListener(
    "popstate",
    function () {

        if (
            AUTHENTICATED_PAGES.includes(
                currentPage
            )
        ) {

            const user =
                auth.currentUser;

            if (!user) {

                redirectTo(
                    LOGIN_PAGE
                );
            }
        }
    }
);


// ============================================================
// SECURITY LOGOUT HELPER
// ============================================================
//
// This does NOT replace your existing logout() function.
// It provides an additional safe logout function:
//
// securityLogout()
// ============================================================

window.securityLogout =
    async function () {

        try {

            await signOut(auth);

            // Replace history so the user cannot simply
            // return to the protected page using Back.
            window.location.replace(
                LOGIN_PAGE
            );

        } catch (error) {

            console.error(
                "Security Logout Error:",
                error
            );

            window.location.replace(
                LOGIN_PAGE
            );
        }
    };


// ============================================================
// CLEAR SENSITIVE BROWSER STORAGE
// ============================================================

function clearSecurityStorage() {

    try {

        // Do NOT blindly remove Firebase's own auth storage.
        // Firebase handles its authentication persistence.

        const keysToRemove = [
            "codeshare_user",
            "codeshare_admin",
            "codeshare_session",
            "admin_session",
            "user_session"
        ];


        keysToRemove.forEach(
            key => {

                try {
                    sessionStorage.removeItem(key);
                } catch (e) {}

            }
        );

    } catch (error) {

        console.warn(
            "Storage cleanup warning:",
            error
        );
    }
}


// ============================================================
// LOGOUT EVENT DETECTION
// ============================================================
//
// If another part of the website signs out the user,
// this observer detects it and sends the user to index.html.
// ============================================================

let wasLoggedIn = false;


onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            wasLoggedIn = true;

            return;
        }


        if (
            wasLoggedIn &&
            !PUBLIC_PAGES.includes(
                currentPage
            )
        ) {

            clearSecurityStorage();

            redirectTo(
                LOGIN_PAGE
            );
        }
    }
);


// ============================================================
// DISABLE ACCESS TO PROTECTED PAGE AFTER LOGOUT
// ============================================================

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState !==
            "visible"
        ) {
            return;
        }


        if (
            !AUTHENTICATED_PAGES.includes(
                currentPage
            )
        ) {
            return;
        }


        const user =
            auth.currentUser;


        if (!user) {

            clearSecurityStorage();

            redirectTo(
                LOGIN_PAGE
            );
        }
    }
);


// ============================================================
// SECURITY STATUS
// ============================================================

console.log(
    "CodeShare Security Guard loaded."
);

console.log(
    "Current page:",
    currentPage
);

console.log(
    "Admin protection:",
    "ENABLED"
);

console.log(
    "Authentication protection:",
    "ENABLED"
);

console.log(
    "Back-cache protection:",
    "ENABLED"
);
