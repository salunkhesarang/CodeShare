// ============================================================
// CodeShare - Common Functions
// File: js/common.js
// ============================================================


// ============================================================
// PAGE NAVIGATION
// ============================================================

/**
 * Open the Welcome page
 */
window.goWelcome = function () {
    window.location.href = "welcome.html";
};


/**
 * Open the Files page
 */
window.goFiles = function () {
    window.location.href = "files.html";
};


/**
 * Next button on Welcome page
 */
window.goNext = function () {
    window.location.href = "files.html";
};


/**
 * Back button
 *
 * If the user is on the Files page, return to Welcome.
 */
window.goBack = function () {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (currentPage === "files.html") {

        window.location.href =
            "welcome.html";

        return;
    }

    if (currentPage === "admin.html") {

        window.location.href =
            "welcome.html";

        return;
    }

    if (currentPage === "welcome.html") {

        window.location.href =
            "index.html";

        return;
    }

    window.history.back();
};


/**
 * Go to Home/Login page
 */
window.goHome = function () {
    window.location.href = "index.html";
};


// ============================================================
// EXTERNAL LINK HANDLER
// ============================================================

/**
 * Open external URL in a new tab.
 *
 * This function intentionally DOES NOT validate whether
 * the URL belongs to GitHub or another specific website.
 *
 * Your website can therefore use:
 *
 * GitHub
 * GitLab
 * Bitbucket
 * Google Drive
 * Any other valid external URL
 */
window.openExternalLink = function (url) {

    if (!url) {
        return;
    }

    const cleanURL =
        String(url).trim();

    if (!cleanURL) {
        return;
    }

    window.open(
        cleanURL,
        "_blank",
        "noopener,noreferrer"
    );
};


// ============================================================
// SAFE TEXT HELPER
// ============================================================

/**
 * Escape HTML characters.
 *
 * This is useful when displaying Firebase/database data
 * inside innerHTML.
 */
window.escapeHTML = function (value) {

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
};


// ============================================================
// COMMON NOTIFICATION
// ============================================================

/**
 * Show a temporary notification.
 *
 * Usage:
 *
 * showNotification("File added successfully", "success");
 *
 * Types:
 * success
 * error
 * warning
 * info
 */
window.showNotification = function (
    message,
    type = "info",
    duration = 3000
) {

    if (!message) {
        return;
    }


    // Remove existing notification

    const oldNotification =
        document.querySelector(
            ".codeshare-notification"
        );

    if (oldNotification) {
        oldNotification.remove();
    }


    // Create notification

    const notification =
        document.createElement("div");

    notification.className =
        `codeshare-notification notification-${type}`;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    // Trigger animation

    requestAnimationFrame(() => {

        notification.classList.add(
            "notification-show"
        );

    });


    // Automatically remove

    setTimeout(() => {

        notification.classList.remove(
            "notification-show"
        );

        setTimeout(() => {

            if (notification.parentNode) {

                notification.remove();

            }

        }, 300);

    }, duration);
};


// ============================================================
// COPY TEXT TO CLIPBOARD
// ============================================================

/**
 * Copy text to clipboard.
 *
 * Usage:
 *
 * copyToClipboard("some text");
 */
window.copyToClipboard = async function (
    text
) {

    if (!text) {
        return false;
    }


    try {

        await navigator.clipboard.writeText(
            String(text)
        );


        showNotification(
            "Copied to clipboard!",
            "success"
        );


        return true;

    } catch (error) {

        console.error(
            "Clipboard Error:",
            error
        );


        // Fallback method

        try {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                String(text);

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();


            showNotification(
                "Copied to clipboard!",
                "success"
            );


            return true;

        } catch (fallbackError) {

            console.error(
                "Clipboard Fallback Error:",
                fallbackError
            );


            showNotification(
                "Unable to copy text.",
                "error"
            );


            return false;
        }
    }
};


// ============================================================
// PAGE LOADING HELPER
// ============================================================

/**
 * Show loading screen.
 */
window.showPageLoading = function (
    message = "Loading..."
) {

    let loader =
        document.getElementById(
            "page-loader"
        );


    if (!loader) {

        loader =
            document.createElement(
                "div"
            );

        loader.id =
            "page-loader";

        loader.className =
            "page-loader";

        document.body.appendChild(
            loader
        );
    }


    loader.innerHTML = `
        <div class="cyber-loader">
            <div class="loader-ring"></div>

            <div class="loader-text">
                ${escapeHTML(message)}
            </div>
        </div>
    `;


    loader.style.display =
        "flex";
};


/**
 * Hide loading screen.
 */
window.hidePageLoading = function () {

    const loader =
        document.getElementById(
            "page-loader"
        );

    if (!loader) {
        return;
    }


    loader.style.display =
        "none";
};


// ============================================================
// BUTTON LOADING STATE
// ============================================================

/**
 * Put button into loading state.
 */
window.setButtonLoading = function (
    button,
    loadingText = "LOADING..."
) {

    if (!button) {
        return;
    }


    if (!button.dataset.originalText) {

        button.dataset.originalText =
            button.textContent;
    }


    button.disabled =
        true;


    button.textContent =
        loadingText;


    button.classList.add(
        "is-loading"
    );
};


/**
 * Restore button state.
 */
window.resetButtonLoading = function (
    button
) {

    if (!button) {
        return;
    }


    button.disabled =
        false;


    if (
        button.dataset.originalText
    ) {

        button.textContent =
            button.dataset.originalText;
    }


    button.classList.remove(
        "is-loading"
    );
};


// ============================================================
// CURRENT PAGE HELPER
// ============================================================

window.getCurrentPage = function () {

    const page =
        window.location.pathname
            .split("/")
            .pop();

    return (
        page || "index.html"
    ).toLowerCase();
};


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Add a small class to body.
         * This can be useful for CSS page-specific styling.
         */

        document.body.classList.add(
            "codeshare-ready"
        );


        /*
         * Automatically add target/security
         * attributes to normal external links.
         *
         * Existing target="_blank" links are preserved.
         */

        const links =
            document.querySelectorAll(
                'a[target="_blank"]'
            );


        links.forEach((link) => {

            const existingRel =
                link.getAttribute("rel") || "";


            const relValues =
                existingRel
                    .split(/\s+/)
                    .filter(Boolean);


            if (
                !relValues.includes(
                    "noopener"
                )
            ) {

                relValues.push(
                    "noopener"
                );
            }


            if (
                !relValues.includes(
                    "noreferrer"
                )
            ) {

                relValues.push(
                    "noreferrer"
                );
            }


            link.setAttribute(
                "rel",
                relValues.join(" ")
            );
        });

    }
);


// ============================================================
// PREVENT ACCIDENTAL DOUBLE SUBMISSION
// ============================================================

document.addEventListener(
    "submit",
    (event) => {

        const form =
            event.target;


        if (
            !form ||
            !form.matches("form")
        ) {
            return;
        }


        /*
         * Authentication and Admin functions manage
         * their own buttons, so we don't disable forms
         * globally here.
         *
         * This listener intentionally remains passive.
         */
    }
);


// ============================================================
// KEYBOARD SHORTCUT
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        /*
         * ESC can close custom modals later.
         *
         * If a modal exists, dispatch a custom event.
         */

        if (
            event.key === "Escape"
        ) {

            document.dispatchEvent(
                new CustomEvent(
                    "codeshare:escape"
                )
            );
        }
    }
);


// ============================================================
// CONSOLE INFORMATION
// ============================================================

console.log(
    "%c CodeShare ",
    "color:#00ff66;font-weight:bold;font-size:18px;"
);

console.log(
    "%c Common module loaded successfully.",
    "color:#00f0ff;"
);