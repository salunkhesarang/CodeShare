// ============================================================
// CodeShare - Admin Dashboard
// File: js/admin.js
// ============================================================

import {
    auth,
    database,
    filesRef
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    ref,
    push,
    set,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// ============================================================
// ADMIN CONFIGURATION
// ============================================================

const ADMIN_EMAIL = "admin@site.com";


// ============================================================
// STATE
// ============================================================

let allAdminFiles = [];

let editingFileKey = null;

let databaseReady = false;

let adminAuthorized = false;


// ============================================================
// DOM ELEMENTS
// ============================================================

let adminFileList = null;

let adminSearchInput = null;

let adminCategoryFilter = null;

let adminSortFilter = null;

let adminResultCount = null;

let addFileForm = null;

let addFileButton = null;

let cancelEditButton = null;


// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAdminPage
);


function initializeAdminPage() {

    /*
     * Do not execute Admin code on other pages.
     */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        currentPage !== "admin.html"
    ) {
        return;
    }


    adminFileList =
        document.getElementById(
            "admin-file-list"
        );


    adminSearchInput =
        document.getElementById(
            "admin-file-search"
        );


    adminCategoryFilter =
        document.getElementById(
            "admin-category-filter"
        );


    adminSortFilter =
        document.getElementById(
            "admin-sort"
        );


    adminResultCount =
        document.getElementById(
            "admin-result-count"
        );


    addFileForm =
        document.getElementById(
            "add-file-form"
        );


    addFileButton =
        document.getElementById(
            "add-file-btn"
        );


    cancelEditButton =
        document.getElementById(
            "cancel-edit-btn"
        );


    setupAdminSearch();

    setupAdminFilters();

    setupEditCancel();

    setupAdminAuth();

    showAdminLoading();
}


// ============================================================
// ADMIN AUTHORIZATION
// ============================================================

function setupAdminAuth() {

    onAuthStateChanged(
        auth,
        (user) => {

            if (!user) {

                window.location.replace(
                    "index.html"
                );

                return;
            }


            const email =
                String(
                    user.email || ""
                )
                .trim()
                .toLowerCase();


            if (
                email !==
                ADMIN_EMAIL
                    .trim()
                    .toLowerCase()
            ) {

                alert(
                    "Unauthorized Access!\nOnly the administrator can access this panel."
                );


                window.location.replace(
                    "welcome.html"
                );


                return;
            }


            adminAuthorized = true;

            loadAdminFiles();
        }
    );
}


// ============================================================
// LOAD FILES
// ============================================================

function loadAdminFiles() {

    if (!adminAuthorized) {
        return;
    }


    onValue(
        filesRef,

        (snapshot) => {

            databaseReady = true;


            const data =
                snapshot.val();


            if (!data) {

                allAdminFiles = [];

                updateAdminCategoryFilter();

                renderAdminFiles();

                updateStatistics();

                return;
            }


            allAdminFiles =
                Object.keys(data).map(
                    (key) => {

                        const file =
                            data[key] || {};


                        return {

                            key: key,

                            name:
                                file.name ||
                                "Untitled File",

                            logo:
                                file.logo ||
                                "📄",

                            desc:
                                file.desc ||
                                "",

                            githubUrl:
                                file.githubUrl ||
                                "",

                            category:
                                file.category ||
                                detectCategory(
                                    file.name,
                                    file.githubUrl
                                ),

                            fileType:
                                file.fileType ||
                                detectFileType(
                                    file.name,
                                    file.githubUrl
                                ),

                            createdAt:
                                Number(
                                    file.createdAt
                                ) || 0,

                            updatedAt:
                                Number(
                                    file.updatedAt
                                ) || 0
                        };
                    }
                );


            updateAdminCategoryFilter();

            renderAdminFiles();

            updateStatistics();

        },

        (error) => {

            console.error(
                "Admin Database Read Error:",
                error
            );


            databaseReady = true;


            if (adminFileList) {

                adminFileList.innerHTML = `
                    <div class="files-empty-state">

                        <div class="empty-state-icon">
                            ⚠️
                        </div>

                        <h3>
                            Database Error
                        </h3>

                        <p>
                            Files could not be loaded.
                            Please check Firebase Realtime Database
                            rules and connection.
                        </p>

                    </div>
                `;
            }
        }
    );
}


// ============================================================
// ADD / EDIT FORM
// ============================================================

window.addGitHubFile =
    async function (event) {

        event.preventDefault();


        if (!adminAuthorized) {

            alert(
                "Unauthorized access."
            );

            return;
        }


        const nameInput =
            document.getElementById(
                "file-name"
            );


        const logoInput =
            document.getElementById(
                "file-logo"
            );


        const descInput =
            document.getElementById(
                "file-desc"
            );


        const urlInput =
            document.getElementById(
                "file-github-url"
            );


        if (
            !nameInput ||
            !logoInput ||
            !descInput ||
            !urlInput
        ) {

            alert(
                "Admin form elements are missing."
            );

            return;
        }


        const name =
            nameInput.value.trim();


        const logo =
            logoInput.value.trim() ||
            "📄";


        const desc =
            descInput.value.trim();


        const githubUrl =
            urlInput.value.trim();


        // ----------------------------------------------------
        // BASIC INPUT VALIDATION
        // ----------------------------------------------------

        if (!name) {

            alert(
                "Please enter a file/project title."
            );

            nameInput.focus();

            return;
        }


        if (!desc) {

            alert(
                "Please enter a description."
            );

            descInput.focus();

            return;
        }


        if (!githubUrl) {

            alert(
                "Please enter the file/project URL."
            );

            urlInput.focus();

            return;
        }


        /*
         * IMPORTANT:
         *
         * We intentionally DO NOT validate whether
         * this is a GitHub URL.
         *
         * GitHub, GitLab, Bitbucket, Google Drive,
         * or any other external URL can be stored.
         */


        // ----------------------------------------------------
        // DUPLICATE PROTECTION
        // ----------------------------------------------------

        const duplicate =
            allAdminFiles.find(
                (file) => {

                    if (
                        editingFileKey &&
                        file.key ===
                        editingFileKey
                    ) {

                        return false;
                    }


                    const sameName =
                        String(
                            file.name
                        )
                        .trim()
                        .toLowerCase() ===
                        name.toLowerCase();


                    const sameURL =
                        String(
                            file.githubUrl
                        )
                        .trim()
                        .toLowerCase() ===
                        githubUrl.toLowerCase();


                    return (
                        sameName ||
                        sameURL
                    );
                }
            );


        if (duplicate) {

            alert(
                "Duplicate detected!\n\nA file with the same name or URL already exists."
            );

            return;
        }


        // ----------------------------------------------------
        // CREATE DATA
        // ----------------------------------------------------

        const now =
            Date.now();


        const fileData = {

            name: name,

            logo: logo,

            desc: desc,

            githubUrl: githubUrl,

            category:
                detectCategory(
                    name,
                    githubUrl
                ),

            fileType:
                detectFileType(
                    name,
                    githubUrl
                ),

            createdAt:
                now,

            updatedAt:
                now
        };


        try {

            setFormButtonLoading(
                true
            );


            // ------------------------------------------------
            // EDIT EXISTING FILE
            // ------------------------------------------------

            if (editingFileKey) {

                const existingFile =
                    allAdminFiles.find(
                        file =>
                            file.key ===
                            editingFileKey
                    );


                fileData.createdAt =
                    existingFile
                        ? existingFile.createdAt
                        : now;


                const fileRef =
                    ref(
                        database,
                        `github_files/${editingFileKey}`
                    );


                await set(
                    fileRef,
                    fileData
                );


                showAdminMessage(
                    "File updated successfully!",
                    "success"
                );


            }

            // ------------------------------------------------
            // ADD NEW FILE
            // ------------------------------------------------

            else {

                await push(
                    filesRef,
                    fileData
                );


                showAdminMessage(
                    "File added successfully!",
                    "success"
                );
            }


            resetFileForm();


        } catch (error) {

            console.error(
                "Admin Save Error:",
                error
            );


            showAdminMessage(
                "Unable to save file. Check Firebase Database rules.",
                "error"
            );


        } finally {

            setFormButtonLoading(
                false
            );
        }
    };


// ============================================================
// EDIT FILE
// ============================================================

window.editFile =
    function (key) {

        if (!adminAuthorized) {

            alert(
                "Unauthorized access."
            );

            return;
        }


        const file =
            allAdminFiles.find(
                item =>
                    item.key === key
            );


        if (!file) {

            alert(
                "File could not be found."
            );

            return;
        }


        const nameInput =
            document.getElementById(
                "file-name"
            );


        const logoInput =
            document.getElementById(
                "file-logo"
            );


        const descInput =
            document.getElementById(
                "file-desc"
            );


        const urlInput =
            document.getElementById(
                "file-github-url"
            );


        if (
            !nameInput ||
            !logoInput ||
            !descInput ||
            !urlInput
        ) {

            alert(
                "Admin form elements are missing."
            );

            return;
        }


        nameInput.value =
            file.name || "";


        logoInput.value =
            file.logo || "📄";


        descInput.value =
            file.desc || "";


        urlInput.value =
            file.githubUrl || "";


        editingFileKey =
            key;


        // Change button text

        if (addFileButton) {

            addFileButton.textContent =
                "UPDATE FILE";
        }


        // Show cancel button

        if (cancelEditButton) {

            cancelEditButton.style.display =
                "inline-flex";
        }


        // Scroll to form

        const formCard =
            document.querySelector(
                ".admin-card"
            );


        if (formCard) {

            formCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };


// ============================================================
// CANCEL EDIT
// ============================================================

function setupEditCancel() {

    if (!cancelEditButton) {
        return;
    }


    cancelEditButton.addEventListener(
        "click",
        resetFileForm
    );
}


function resetFileForm() {

    editingFileKey =
        null;


    if (addFileForm) {

        addFileForm.reset();
    }


    if (addFileButton) {

        addFileButton.disabled =
            false;

        addFileButton.textContent =
            "ADD FILE LINK";
    }


    if (cancelEditButton) {

        cancelEditButton.style.display =
            "none";
    }
}


// ============================================================
// DELETE FILE
// ============================================================

window.deleteFile =
    async function (key) {

        if (!adminAuthorized) {

            alert(
                "Unauthorized access."
            );

            return;
        }


        const file =
            allAdminFiles.find(
                item =>
                    item.key === key
            );


        if (!file) {

            alert(
                "File not found."
            );

            return;
        }


        const confirmed =
            confirm(
                `Delete this file?\n\n${file.name}\n\nThis action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        try {

            const fileRef =
                ref(
                    database,
                    `github_files/${key}`
                );


            await remove(
                fileRef
            );


            showAdminMessage(
                "File deleted successfully!",
                "success"
            );


            if (
                editingFileKey === key
            ) {

                resetFileForm();
            }


        } catch (error) {

            console.error(
                "Delete Error:",
                error
            );


            showAdminMessage(
                "Unable to delete file. Check Firebase rules.",
                "error"
            );
        }
    };


// ============================================================
// SEARCH
// ============================================================

function setupAdminSearch() {

    if (!adminSearchInput) {
        return;
    }


    adminSearchInput.addEventListener(
        "input",
        () => {

            renderAdminFiles();
        }
    );
}


// ============================================================
// FILTERS
// ============================================================

function setupAdminFilters() {

    if (adminCategoryFilter) {

        adminCategoryFilter.addEventListener(
            "change",
            renderAdminFiles
        );
    }


    if (adminSortFilter) {

        adminSortFilter.addEventListener(
            "change",
            renderAdminFiles
        );
    }
}


// ============================================================
// GET FILTERED ADMIN FILES
// ============================================================

function getFilteredAdminFiles() {

    let files =
        [...allAdminFiles];


    const search =
        adminSearchInput
            ? adminSearchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        adminCategoryFilter
            ? adminCategoryFilter.value
            : "all";


    const sort =
        adminSortFilter
            ? adminSortFilter.value
            : "newest";


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search) {

        files =
            files.filter(
                (file) => {

                    return (

                        String(
                            file.name || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            file.desc || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            file.category || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            file.fileType || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            file.githubUrl || ""
                        )
                        .toLowerCase()
                        .includes(search)
                    );
                }
            );
    }


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
        category &&
        category !== "all"
    ) {

        files =
            files.filter(
                file =>
                    String(
                        file.category || ""
                    ).toLowerCase() ===
                    category.toLowerCase()
            );
    }


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    files.sort(
        (a, b) => {

            switch (sort) {

                case "oldest":

                    return (
                        a.createdAt -
                        b.createdAt
                    );


                case "az":

                    return String(
                        a.name
                    ).localeCompare(
                        String(b.name),
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    );


                case "za":

                    return String(
                        b.name
                    ).localeCompare(
                        String(a.name),
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    );


                case "newest":

                default:

                    return (
                        b.createdAt -
                        a.createdAt
                    );
            }
        }
    );


    return files;
}


// ============================================================
// RENDER ADMIN FILES
// ============================================================

function renderAdminFiles() {

    if (!adminFileList) {
        return;
    }


    if (!databaseReady) {

        showAdminLoading();

        return;
    }


    const files =
        getFilteredAdminFiles();


    updateAdminResultCount(
        files.length
    );


    if (allAdminFiles.length === 0) {

        adminFileList.innerHTML = `
            <div class="files-empty-state">

                <div class="empty-state-icon">
                    📂
                </div>

                <h3>
                    No Files Yet
                </h3>

                <p>
                    Add your first code file
                    using the form above.
                </p>

            </div>
        `;

        return;
    }


    if (files.length === 0) {

        adminFileList.innerHTML = `
            <div class="files-empty-state">

                <div class="empty-state-icon">
                    🔍
                </div>

                <h3>
                    No Matching Files
                </h3>

                <p>
                    No files match your search or filter.
                </p>

            </div>
        `;

        return;
    }


    let html = "";


    files.forEach(
        (file) => {

            html += createAdminFileCard(
                file
            );
        }
    );


    adminFileList.innerHTML =
        html;


    attachAdminCardEvents();
}


// ============================================================
// ADMIN FILE CARD
// ============================================================

function createAdminFileCard(file) {

    const safeKey =
        escapeAttribute(
            file.key
        );


    const safeName =
        escapeHTML(
            file.name
        );


    const safeLogo =
        escapeHTML(
            file.logo
        );


    const safeDesc =
        escapeHTML(
            file.desc
        );


    const safeCategory =
        escapeHTML(
            file.category
        );


    const safeType =
        escapeHTML(
            file.fileType
        );


    const safeURL =
        escapeHTML(
            file.githubUrl
        );


    return `
        <article
            class="file-card admin-file-card"
            data-file-key="${safeKey}"
        >

            <div class="file-info">

                <div
                    class="file-logo"
                    aria-hidden="true"
                >
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
                            ${safeCategory}
                        </span>

                        <span>
                            ${safeType}
                        </span>

                    </div>


                    <p class="admin-file-url">

                        <strong>
                            URL:
                        </strong>

                        <a
                            href="${safeURL}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ${safeURL}
                        </a>

                    </p>

                </div>

            </div>


            <div class="file-actions">

                <button
                    type="button"
                    class="btn btn-primary btn-sm admin-edit-btn"
                    data-key="${safeKey}"
                >
                    EDIT
                </button>


                <button
                    type="button"
                    class="btn btn-danger btn-sm admin-delete-btn"
                    data-key="${safeKey}"
                >
                    DELETE
                </button>

            </div>

        </article>
    `;
}


// ============================================================
// ADMIN CARD EVENTS
// ============================================================

function attachAdminCardEvents() {

    const editButtons =
        adminFileList.querySelectorAll(
            ".admin-edit-btn"
        );


    editButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    editFile(
                        button.dataset.key
                    );
                }
            );
        }
    );


    const deleteButtons =
        adminFileList.querySelectorAll(
            ".admin-delete-btn"
        );


    deleteButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    deleteFile(
                        button.dataset.key
                    );
                }
            );
        }
    );
}


// ============================================================
// CATEGORY FILTER
// ============================================================

function updateAdminCategoryFilter() {

    if (!adminCategoryFilter) {
        return;
    }


    const previous =
        adminCategoryFilter.value;


    const categories =
        new Set();


    allAdminFiles.forEach(
        (file) => {

            if (
                file.category
            ) {

                categories.add(
                    String(
                        file.category
                    )
                );
            }
        }
    );


    const sorted =
        Array.from(
            categories
        ).sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        sensitivity:
                            "base"
                    }
                )
        );


    let html = `
        <option value="all">
            All Categories
        </option>
    `;


    sorted.forEach(
        (category) => {

            const safe =
                escapeHTML(
                    category
                );


            html += `
                <option value="${safe}">
                    ${safe}
                </option>
            `;
        }
    );


    adminCategoryFilter.innerHTML =
        html;


    const exists =
        Array.from(
            adminCategoryFilter.options
        ).some(
            option =>
                option.value ===
                previous
        );


    if (exists) {

        adminCategoryFilter.value =
            previous;

    } else {

        adminCategoryFilter.value =
            "all";
    }
}


// ============================================================
// ADMIN RESULT COUNT
// ============================================================

function updateAdminResultCount(
    count
) {

    if (!adminResultCount) {
        return;
    }


    adminResultCount.textContent =
        `${count} shown / ${allAdminFiles.length} total`;
}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const total =
        allAdminFiles.length;


    const githubCount =
        allAdminFiles.filter(
            file =>
                String(
                    file.githubUrl || ""
                )
                .toLowerCase()
                .includes(
                    "github.com"
                )
        ).length;


    const categoryCount =
        new Set(
            allAdminFiles.map(
                file =>
                    file.category ||
                    "Other"
            )
        ).size;


    const latestFile =
        [...allAdminFiles]
            .sort(
                (a, b) =>
                    b.createdAt -
                    a.createdAt
            )[0];


    const totalElement =
        document.getElementById(
            "total-files"
        );


    const githubElement =
        document.getElementById(
            "github-files"
        );


    const categoryElement =
        document.getElementById(
            "total-categories"
        );


    const latestElement =
        document.getElementById(
            "latest-file"
        );


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (githubElement) {

        githubElement.textContent =
            githubCount;
    }


    if (categoryElement) {

        categoryElement.textContent =
            categoryCount;
    }


    if (latestElement) {

        latestElement.textContent =
            latestFile
                ? latestFile.name
                : "—";
    }
}


// ============================================================
// LOADING
// ============================================================

function showAdminLoading() {

    if (!adminFileList) {
        return;
    }


    adminFileList.innerHTML = `
        <div class="files-loading-state">

            <div class="cyber-loader">

                <div class="loader-ring"></div>

                <div class="loader-text">
                    LOADING ADMIN DATA...
                </div>

            </div>

        </div>
    `;
}


// ============================================================
// BUTTON LOADING
// ============================================================

function setFormButtonLoading(
    loading
) {

    if (!addFileButton) {
        return;
    }


    if (loading) {

        addFileButton.disabled =
            true;


        addFileButton.dataset
            .originalText =
            addFileButton.textContent;


        addFileButton.textContent =
            editingFileKey
                ? "UPDATING..."
                : "ADDING...";

    } else {

        addFileButton.disabled =
            false;


        addFileButton.textContent =
            editingFileKey
                ? "UPDATE FILE"
                : "ADD FILE LINK";
    }
}


// ============================================================
// ADMIN MESSAGE
// ============================================================

function showAdminMessage(
    message,
    type = "info"
) {

    if (
        typeof window.showNotification ===
        "function"
    ) {

        window.showNotification(
            message,
            type
        );

        return;
    }


    alert(message);
}


// ============================================================
// FILE TYPE DETECTION
// ============================================================

function detectFileType(
    name = "",
    url = ""
) {

    const value =
        `${name} ${url}`
            .toLowerCase();


    const types = {

        ".html": "HTML",

        ".htm": "HTML",

        ".css": "CSS",

        ".js": "JavaScript",

        ".mjs": "JavaScript",

        ".jsx": "React JSX",

        ".ts": "TypeScript",

        ".tsx": "TypeScript",

        ".py": "Python",

        ".java": "Java",

        ".c": "C",

        ".cpp": "C++",

        ".h": "C/C++ Header",

        ".hpp": "C++ Header",

        ".cs": "C#",

        ".php": "PHP",

        ".json": "JSON",

        ".xml": "XML",

        ".sql": "SQL",

        ".sh": "Shell",

        ".bat": "Batch",

        ".md": "Markdown",

        ".txt": "Text",

        ".dart": "Dart",

        ".kt": "Kotlin",

        ".kts": "Kotlin",

        ".swift": "Swift",

        ".rs": "Rust",

        ".go": "Go"
    };


    for (
        const extension in types
    ) {

        if (
            value.includes(
                extension
            )
        ) {

            return types[
                extension
            ];
        }
    }


    if (
        value.includes(
            "github.com"
        )
    ) {

        return "GitHub Project";
    }


    return "Code File";
}


// ============================================================
// CATEGORY DETECTION
// ============================================================

function detectCategory(
    name = "",
    url = ""
) {

    const value =
        `${name} ${url}`
            .toLowerCase();


    if (
        value.includes("html") ||
        value.includes("css") ||
        value.includes("frontend") ||
        value.includes("ui") ||
        value.includes("web")
    ) {

        return "Web Development";
    }


    if (
        value.includes(
            "javascript"
        ) ||
        value.includes(".js") ||
        value.includes("react") ||
        value.includes("node")
    ) {

        return "JavaScript";
    }


    if (
        value.includes(
            "python"
        ) ||
        value.includes(".py")
    ) {

        return "Python";
    }


    if (
        value.includes(
            "android"
        ) ||
        value.includes(
            "java"
        ) ||
        value.includes(
            "kotlin"
        )
    ) {

        return "Android";
    }


    if (
        value.includes(
            "database"
        ) ||
        value.includes(
            "sql"
        ) ||
        value.includes(
            "firebase"
        )
    ) {

        return "Database";
    }


    if (
        value.includes(
            "api"
        ) ||
        value.includes(
            "backend"
        ) ||
        value.includes(
            "server"
        )
    ) {

        return "Backend";
    }


    if (
        value.includes(
            "github"
        ) ||
        value.includes(
            "project"
        )
    ) {

        return "Projects";
    }


    return "Other";
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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// ATTRIBUTE ESCAPE
// ============================================================

function escapeAttribute(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}


// ============================================================
// PUBLIC ADMIN REFRESH
// ============================================================

window.refreshAdminFiles =
    function () {

        renderAdminFiles();

        updateStatistics();
    };


// ============================================================
// CONSOLE
// ============================================================

console.log(
    "%c CodeShare ADMIN ",
    "color:#ff0055;font-weight:bold;font-size:18px;"
);

console.log(
    "%c Admin module loaded successfully.",
    "color:#00f0ff;"
);