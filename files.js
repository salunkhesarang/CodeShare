// ============================================================
// CodeShare - Files Repository
// File: js/files.js
// ============================================================


// ============================================================
// FIREBASE APP
// ============================================================

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";


// ============================================================
// FIREBASE AUTH
// ============================================================

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// ============================================================
// FIREBASE DATABASE
// ============================================================

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// ============================================================
// FIREBASE CONFIGURATION
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
// INITIALIZE FIREBASE SAFELY
// ============================================================
//
// Isse duplicate Firebase initialization error nahi aayega.
// Agar Firebase already initialized hai to existing app use hoga.
//
// ============================================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);


// ============================================================
// INITIALIZE AUTH + DATABASE
// ============================================================

const auth = getAuth(app);

const database = getDatabase(app);


// ============================================================
// DATABASE REFERENCE
// ============================================================

const filesRef = ref(
    database,
    "github_files"
);


// ============================================================
// DOM ELEMENTS
// ============================================================

const fileList =
    document.getElementById("user-file-list");

const searchInput =
    document.getElementById("file-search") ||
    document.getElementById("search-input");

const searchButton =
    document.getElementById("search-btn");

const clearSearchButton =
    document.getElementById("clear-search");

const resultCount =
    document.getElementById("result-count");

const sortSelect =
    document.getElementById("sort-files");

const categorySelect =
    document.getElementById("category-filter");


// ============================================================
// GLOBAL DATA
// ============================================================

let allFiles = [];

let firebaseListenerStarted = false;

let currentUser = null;


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
// SAFE URL
// ============================================================
//
// GitHub ke alawa dusri websites ke URLs bhi allowed hain.
// Yahan GitHub-only validation nahi hai.
//
// ============================================================

function safeURL(value) {

    if (!value) {
        return "#";
    }

    return escapeHTML(
        String(value).trim()
    );
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "Date unavailable";
    }

    const date =
        new Date(Number(timestamp));

    if (isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ============================================================
// LOADING STATE
// ============================================================

function showLoadingState() {

    if (!fileList) {
        return;
    }

    fileList.innerHTML = `
        <div class="loading-state">

            <div class="cyber-loader"></div>

            <p class="loading-text">
                Connecting to code repository...
            </p>

            <small>
                Fetching available files...
            </small>

        </div>
    `;
}


// ============================================================
// AUTH STATE
// ============================================================
//
// IMPORTANT:
// Firebase Database Rules me:
// .read = auth != null
//
// Isliye pehle user authentication confirm karna zaroori hai.
// Uske baad hi database listener start hoga.
//
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;

        // ----------------------------------------------------
        // USER LOGGED OUT
        // ----------------------------------------------------

        if (!user) {

            console.warn(
                "CodeShare: User is not authenticated."
            );

            window.location.href =
                "index.html";

            return;
        }


        // ----------------------------------------------------
        // DISPLAY USER EMAIL
        // ----------------------------------------------------

        const emailDisplay =
            document.getElementById(
                "user-email-display"
            );

        if (emailDisplay) {

            emailDisplay.textContent =
                user.email || "User";
        }


        // ----------------------------------------------------
        // START DATABASE LISTENER
        // ----------------------------------------------------

        if (!firebaseListenerStarted) {

            firebaseListenerStarted =
                true;

            loadFiles();
        }

    }
);


// ============================================================
// LOAD FILES FROM FIREBASE
// ============================================================

function loadFiles() {

    if (!fileList) {

        console.error(
            "CodeShare Error: #user-file-list not found."
        );

        return;
    }


    showLoadingState();


    onValue(

        filesRef,

        (snapshot) => {

            console.log(
                "CodeShare: Firebase data received."
            );


            const data =
                snapshot.val();


            // ------------------------------------------------
            // NO DATA
            // ------------------------------------------------

            if (!data) {

                allFiles = [];

                updateResultCount(0);

                showEmptyState(
                    "No code files available yet.",
                    "📂"
                );

                return;
            }


            // ------------------------------------------------
            // CONVERT FIREBASE OBJECT TO ARRAY
            // ------------------------------------------------

            allFiles =
                Object.entries(data)
                    .map(
                        ([key, value]) => {

                            return {

                                key: key,

                                name:
                                    value?.name ||
                                    "Unnamed File",

                                logo:
                                    value?.logo ||
                                    "📄",

                                desc:
                                    value?.desc ||
                                    "No description available.",

                                githubUrl:
                                    value?.githubUrl ||
                                    "",

                                category:
                                    value?.category ||
                                    "Other",

                                createdAt:
                                    value?.createdAt ||
                                    0

                            };

                        }
                    );


            // ------------------------------------------------
            // NEWEST FIRST DEFAULT
            // ------------------------------------------------

            allFiles.sort(
                (a, b) =>
                    Number(b.createdAt) -
                    Number(a.createdAt)
            );


            console.log(
                "CodeShare: Files loaded:",
                allFiles.length
            );


            // ------------------------------------------------
            // APPLY FILTERS
            // ------------------------------------------------

            applyFilters();

        },

        (error) => {

            console.error(
                "CodeShare Firebase Database Error:",
                error
            );


            allFiles = [];

            updateResultCount(0);


            const errorMessage =
                error?.message ||
                "Unknown Firebase error.";


            fileList.innerHTML = `

                <div class="empty-state error-state">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable To Load Files
                    </h3>

                    <p>
                        Files could not be loaded
                        from Firebase Realtime Database.
                    </p>

                    <small>
                        ${escapeHTML(errorMessage)}
                    </small>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="retry-files-btn">

                        🔄 RETRY

                    </button>

                </div>
            `;


            const retryButton =
                document.getElementById(
                    "retry-files-btn"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    () => {

                        firebaseListenerStarted =
                            false;

                        loadFiles();

                    }
                );
            }

        }
    );
}


// ============================================================
// APPLY SEARCH + CATEGORY + SORT
// ============================================================

function applyFilters() {

    let filteredFiles =
        [...allFiles];


    // ========================================================
    // SEARCH
    // ========================================================

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    if (searchTerm) {

        filteredFiles =
            filteredFiles.filter(
                (file) => {

                    const name =
                        String(file.name)
                            .toLowerCase();

                    const desc =
                        String(file.desc)
                            .toLowerCase();

                    const category =
                        String(file.category)
                            .toLowerCase();


                    return (
                        name.includes(searchTerm) ||
                        desc.includes(searchTerm) ||
                        category.includes(searchTerm)
                    );

                }
            );
    }


    // ========================================================
    // CATEGORY FILTER
    // ========================================================

    if (
        categorySelect &&
        categorySelect.value &&
        categorySelect.value !== "all"
    ) {

        const selectedCategory =
            categorySelect.value
                .trim()
                .toLowerCase();


        filteredFiles =
            filteredFiles.filter(
                (file) => {

                    return String(file.category)
                        .trim()
                        .toLowerCase() ===
                        selectedCategory;

                }
            );
    }


    // ========================================================
    // SORT
    // ========================================================

    if (sortSelect) {

        const sortValue =
            sortSelect.value;


        switch (sortValue) {

            case "name-asc":

                filteredFiles.sort(
                    (a, b) =>
                        String(a.name)
                            .localeCompare(
                                String(b.name)
                            )
                );

                break;


            case "name-desc":

                filteredFiles.sort(
                    (a, b) =>
                        String(b.name)
                            .localeCompare(
                                String(a.name)
                            )
                );

                break;


            case "oldest":

                filteredFiles.sort(
                    (a, b) =>
                        Number(a.createdAt) -
                        Number(b.createdAt)
                );

                break;


            case "newest":

            default:

                filteredFiles.sort(
                    (a, b) =>
                        Number(b.createdAt) -
                        Number(a.createdAt)
                );

                break;
        }
    }


    // ========================================================
    // RESULT COUNT
    // ========================================================

    updateResultCount(
        filteredFiles.length
    );


    // ========================================================
    // RENDER
    // ========================================================

    renderFiles(
        filteredFiles
    );
}


// ============================================================
// RENDER FILES
// ============================================================

function renderFiles(files) {

    if (!fileList) {
        return;
    }


    // --------------------------------------------------------
    // EMPTY RESULT
    // --------------------------------------------------------

    if (!files.length) {

        showEmptyState(
            "No matching files found.",
            "🔍"
        );

        return;
    }


    let html = "";


    // --------------------------------------------------------
    // CREATE FILE CARDS
    // --------------------------------------------------------

    files.forEach(
        (file) => {

            const safeName =
                escapeHTML(file.name);

            const safeLogo =
                escapeHTML(file.logo);

            const safeDesc =
                escapeHTML(file.desc);

            const safeCategory =
                escapeHTML(file.category);

            const safeFileURL =
                safeURL(file.githubUrl);

            const date =
                formatDate(file.createdAt);


            html += `

                <article
                    class="file-card"
                    data-file-name="${safeName}">

                    <div class="file-info">

                        <div class="file-logo">
                            ${safeLogo}
                        </div>


                        <div class="file-details">

                            <h4>
                                ${safeName}
                            </h4>

                            <p>
                                ${safeDesc}
                            </p>


                            <div class="file-meta">

                                <span>
                                    📁 ${safeCategory}
                                </span>

                                <span>
                                    📅 ${date}
                                </span>

                            </div>

                        </div>

                    </div>


                    <a
                        href="${safeFileURL}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-github view-code-btn">

                        VIEW CODE ↗

                    </a>

                </article>
            `;
        }
    );


    fileList.innerHTML =
        html;
}


// ============================================================
// EMPTY STATE
// ============================================================

function showEmptyState(
    message,
    icon = "📂"
) {

    if (!fileList) {
        return;
    }


    fileList.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ${icon}
            </div>

            <h3>
                ${escapeHTML(message)}
            </h3>

            <p>
                Try another search term
                or clear the current filters.
            </p>

            <button
                type="button"
                class="btn btn-primary"
                id="empty-clear-btn">

                🔄 SHOW ALL FILES

            </button>

        </div>
    `;


    const clearButton =
        document.getElementById(
            "empty-clear-btn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearAllFilters
        );
    }
}


// ============================================================
// RESULT COUNT
// ============================================================

function updateResultCount(count) {

    if (!resultCount) {
        return;
    }


    resultCount.textContent =
        `${count} file${count === 1 ? "" : "s"} found`;
}


// ============================================================
// SEARCH INPUT
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            applyFilters();

        }
    );


    searchInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                applyFilters();
            }

        }
    );
}


// ============================================================
// SEARCH BUTTON
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        () => {

            applyFilters();

        }
    );
}


// ============================================================
// CLEAR SEARCH BUTTON
// ============================================================

if (clearSearchButton) {

    clearSearchButton.addEventListener(
        "click",
        clearAllFilters
    );
}


// ============================================================
// SORT SELECT
// ============================================================

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        () => {

            applyFilters();

        }
    );
}


// ============================================================
// CATEGORY SELECT
// ============================================================

if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        () => {

            applyFilters();

        }
    );
}


// ============================================================
// CLEAR ALL FILTERS
// ============================================================

function clearAllFilters() {

    if (searchInput) {

        searchInput.value =
            "";
    }


    if (categorySelect) {

        categorySelect.value =
            "all";
    }


    if (sortSelect) {

        sortSelect.value =
            "newest";
    }


    applyFilters();
}


// ============================================================
// BACK TO WELCOME
// ============================================================
//
// Event delegation use kiya gaya hai.
// Isliye button dynamically create hone par bhi kaam karega.
//
// ============================================================

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "#back-btn, #files-back-btn, [data-action='back-to-welcome']"
            );


        if (!button) {
            return;
        }


        event.preventDefault();


        window.location.href =
            "welcome.html";
    }
);


// ============================================================
// LOGOUT
// ============================================================
//
// files.html ke Logout button ke liye.
// ============================================================

window.logout = async function () {

    try {

        sessionStorage.setItem(
            "codeshare_manual_logout",
            "true"
        );

        await signOut(auth);

        window.location.replace(
            "index.html"
        );

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

        sessionStorage.removeItem(
            "codeshare_manual_logout"
        );

        alert(
            "Logout failed. Please try again."
        );
    }
};

// ============================================================
// START MESSAGE
// ============================================================

console.log(
    "CodeShare files.js loaded successfully."
);

console.log(
    "Waiting for Firebase Authentication..."
);