// ============================================================
// CodeShare Security Alert System
// File: js/alert.js
// Version: 6.0
// ============================================================

import {
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// ============================================================
// CONFIG
// ============================================================

const ALERT_WORKER_URL =
    "https://codeshare-alert.sarangsalunkhe885.workers.dev";

const ADMIN_EMAIL =
    "admin@site.com";


// ============================================================
// FIREBASE
// ============================================================

let auth = null;

try {

    if (getApps().length > 0) {

        auth = getAuth(getApp());

    }

} catch (error) {

    console.error(
        "Alert Firebase initialization error:",
        error
    );

}


// ============================================================
// STATE
// ============================================================

let currentUser = null;

const alertCooldown = {};

let originalTitle =
    document.title;

let mutationCount = 0;

let securityStarted = false;

let devtoolsAlertSent = false;

let scriptAlertSent = false;

let titleAlertSent = false;

let storageAlertSent = false;

let networkAlertSent = false;

let lastNetworkStatus =
    navigator.onLine
        ? "ONLINE"
        : "OFFLINE";


// ============================================================
// PAGE
// ============================================================

function getPageName() {

    const path =
        window.location.pathname;

    const page =
        path.split("/").pop();

    return page || "index.html";

}


// ============================================================
// DEVICE
// ============================================================

function getDeviceInfo() {

    return {

        userAgent:
            navigator.userAgent ||
            "Unknown",

        platform:
            navigator.platform ||
            "Unknown",

        language:
            navigator.language ||
            "Unknown",

        screen:
            `${window.screen.width}x${window.screen.height}`,

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone ||
            "Unknown",

        online:
            navigator.onLine

    };

}


// ============================================================
// STRING
// ============================================================

function safeString(
    value,
    max = 1500
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .slice(0, max);

}


// ============================================================
// COOLDOWN
// ============================================================

function canSendAlert(
    type,
    seconds = 30
) {

    const now =
        Date.now();

    const last =
        alertCooldown[type] || 0;

    if (
        now - last <
        seconds * 1000
    ) {

        return false;

    }

    alertCooldown[type] =
        now;

    return true;

}


// ============================================================
// FIREBASE TOKEN
// ============================================================

async function getFirebaseToken() {

    try {

        if (!auth) {

            return null;

        }

        const user =
            auth.currentUser;

        if (!user) {

            return null;

        }

        return await user.getIdToken();

    } catch (error) {

        console.error(
            "Firebase token error:",
            error
        );

        return null;

    }

}


// ============================================================
// SEND ALERT
// ============================================================

async function sendSecurityAlert(
    type,
    reason,
    extra = {},
    options = {}
) {

    if (
        !canSendAlert(type)
    ) {

        return {
            ok: false,
            skipped: true
        };

    }


    try {

        const user =
            currentUser ||
            auth?.currentUser ||
            null;


        const payload = {

            type: type,

            reason:
                safeString(
                    reason
                ),

            page:
                getPageName(),

            url:
                window.location.href,

            timestamp:
                new Date().toISOString(),

            user: {

                email:
                    user?.email ||
                    options.email ||
                    "Not available",

                uid:
                    user?.uid ||
                    options.uid ||
                    "Not available",

                name:
                    user?.displayName ||
                    "Unknown"

            },

            device:
                getDeviceInfo(),

            extra:
                extra

        };


        const headers = {

            "Content-Type":
                "application/json"

        };


        // ====================================================
        // AUTH TOKEN
        // ====================================================

        const token =
            await getFirebaseToken();


        if (token) {

            headers.Authorization =
                "Bearer " + token;

        }


        // ====================================================
        // WORKER
        // ====================================================

        const response =
            await fetch(
                ALERT_WORKER_URL +
                "/alert",
                {

                    method: "POST",

                    headers: headers,

                    body:
                        JSON.stringify(
                            payload
                        ),

                    keepalive: true

                }
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch {

            data = null;

        }


        if (!response.ok) {

            console.error(
                "Security alert failed:",
                response.status,
                data
            );

            return {

                ok: false,

                status:
                    response.status,

                data:
                    data

            };

        }


        console.log(
            "CodeShare alert sent:",
            type
        );


        return {

            ok: true,

            status:
                response.status,

            data:
                data

        };


    } catch (error) {

        console.error(
            "Security alert error:",
            error
        );

        return {

            ok: false,

            error:
                error.message

        };

    }

}


// ============================================================
// AUTH MONITOR
// ============================================================

function initializeAuthMonitor() {

    if (!auth) {

        console.warn(
            "Firebase Auth unavailable."
        );

        return;

    }


    onAuthStateChanged(
        auth,
        function(user) {

            currentUser =
                user || null;


            if (user) {

                console.log(
                    "Security monitor:",
                    user.email
                );

            } else {

                console.log(
                    "Security monitor: logged out"
                );

            }

        }
    );

}


// ============================================================
// NEW REGISTRATION
// ============================================================
//
// IMPORTANT:
//
// Registration alert is generated ONLY when auth.js
// explicitly sends the "codeshare:new-registration"
// event.
//
// Normal login DOES NOT trigger this.
//
// ============================================================

function initializeRegistrationMonitor() {

    window.addEventListener(
        "codeshare:new-registration",
        async function(event) {

            const detail =
                event.detail || {};


            const email =
                detail.email ||
                currentUser?.email ||
                "Unknown";


            const uid =
                detail.uid ||
                currentUser?.uid ||
                "Unknown";


            console.log(
                "New CodeShare registration:",
                email
            );


            await sendSecurityAlert(
                "NEW_REGISTRATION",
                "A new CodeShare user account was created.",
                {

                    registrationEmail:
                        email

                },

                {

                    email:
                        email,

                    uid:
                        uid

                }
            );

        }
    );

}


// ============================================================
// UNAUTHORIZED PAGE ACCESS
// ============================================================

function initializeUnauthorizedAccessMonitor() {

    const page =
        getPageName();


    const protectedPages = [

        "welcome.html",

        "files.html",

        "account.html",

        "admin.html"

    ];


    if (
        !protectedPages.includes(page)
    ) {

        return;

    }


    if (!auth) {

        return;

    }


    onAuthStateChanged(
        auth,
        async function(user) {

            // =================================================
            // LOGGED-IN USER
            // =================================================

            if (user) {

                const email =
                    (
                        user.email ||
                        ""
                    ).toLowerCase();


                const isAdmin =
                    email ===
                    ADMIN_EMAIL.toLowerCase();


                // ---------------------------------------------
                // ADMIN PAGE
                // ---------------------------------------------

                if (
                    page ===
                    "admin.html"
                ) {

                    if (isAdmin) {

                        console.log(
                            "Admin authorized."
                        );

                        return;

                    }


                    // Normal logged-in user
                    // trying admin page

                    await sendSecurityAlert(
                        "UNAUTHORIZED_PAGE_ACCESS",
                        "A normal user attempted to access the admin page.",
                        {

                            attemptedPage:
                                page

                        }
                    );

                    return;

                }


                // ---------------------------------------------
                // NORMAL PROTECTED PAGES
                // ---------------------------------------------

                if (

                    page ===
                        "welcome.html" ||

                    page ===
                        "files.html" ||

                    page ===
                        "account.html"

                ) {

                    // =========================================
                    // THIS IS NORMAL.
                    // NO ALERT.
                    // =========================================

                    console.log(
                        "Authorized page access:",
                        page
                    );

                    return;

                }

            }


            // =================================================
            // LOGGED OUT
            // =================================================

            if (!user) {

                await sendSecurityAlert(
                    "UNAUTHORIZED_PAGE_ACCESS",
                    "A protected page was opened without authentication.",
                    {

                        attemptedPage:
                            page

                    }
                );

            }

        }
    );

}


// ============================================================
// DEVTOOLS
// ============================================================

function detectDevTools() {

    let opened =
        false;


    const threshold =
        160;


    try {

        if (
            window.outerWidth -
            window.innerWidth >
            threshold
        ) {

            opened = true;

        }


        if (
            window.outerHeight -
            window.innerHeight >
            threshold
        ) {

            opened = true;

        }

    } catch {}


    if (
        opened &&
        !devtoolsAlertSent
    ) {

        devtoolsAlertSent =
            true;


        sendSecurityAlert(
            "DEVTOOLS_DETECTED",
            "Browser developer tools may be open."
        );

    }

}


function initializeDevToolsMonitor() {

    setInterval(
        detectDevTools,
        2000
    );

}


// ============================================================
// KEYBOARD MONITOR
// ============================================================

function initializeKeyboardMonitor() {

    document.addEventListener(
        "keydown",
        function(event) {

            let shortcut =
                "";


            if (
                event.key ===
                "F12"
            ) {

                shortcut =
                    "F12";

            }


            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key
                    .toLowerCase() ===
                "i"
            ) {

                shortcut =
                    "CTRL + SHIFT + I";

            }


            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key
                    .toLowerCase() ===
                "j"
            ) {

                shortcut =
                    "CTRL + SHIFT + J";

            }


            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key
                    .toLowerCase() ===
                "c"
            ) {

                shortcut =
                    "CTRL + SHIFT + C";

            }


            if (
                event.ctrlKey &&
                event.key
                    .toLowerCase() ===
                "u"
            ) {

                shortcut =
                    "CTRL + U";

            }


            if (!shortcut) {

                return;

            }


            sendSecurityAlert(
                "SUSPICIOUS_KEYBOARD",
                "A browser inspection shortcut was pressed.",
                {

                    shortcut:
                        shortcut

                }
            );

        },
        true
    );

}


// ============================================================
// DOM MONITOR
// ============================================================

function initializeDOMMonitor() {

    if (
        typeof MutationObserver ===
        "undefined"
    ) {

        return;

    }


    const observer =
        new MutationObserver(
            function(mutations) {

                mutationCount +=
                    mutations.length;


                if (
                    mutationCount >= 30
                ) {

                    sendSecurityAlert(
                        "DOM_TAMPERING",
                        "A large number of DOM mutations was detected.",
                        {

                            mutations:
                                mutationCount

                        }
                    );

                    mutationCount =
                        0;

                }

            }
        );


    try {

        observer.observe(
            document.documentElement,
            {

                subtree: true,

                childList: true,

                attributes: true

            }
        );

    } catch (error) {

        console.error(
            "DOM monitor error:",
            error
        );

    }

}


// ============================================================
// TITLE MONITOR
// ============================================================

function initializeTitleMonitor() {

    setInterval(
        function() {

            if (
                document.title !==
                originalTitle
            ) {

                if (
                    !titleAlertSent
                ) {

                    titleAlertSent =
                        true;


                    sendSecurityAlert(
                        "PAGE_TAMPERING",
                        "The page title was changed unexpectedly.",
                        {

                            originalTitle:
                                originalTitle,

                            currentTitle:
                                document.title

                        }
                    );

                }

            }

        },
        3000
    );

}


// ============================================================
// SCRIPT MONITOR
// ============================================================

function initializeScriptMonitor() {

    if (
        typeof MutationObserver ===
        "undefined"
    ) {

        return;

    }


    const originalScripts =
        new Set();


    document
        .querySelectorAll(
            "script"
        )
        .forEach(
            function(script) {

                originalScripts.add(
                    script
                );

            }
        );


    const observer =
        new MutationObserver(
            function(mutations) {

                for (
                    const mutation
                    of mutations
                ) {

                    if (
                        mutation.type !==
                        "childList"
                    ) {

                        continue;

                    }


                    for (
                        const node
                        of mutation.addedNodes
                    ) {

                        if (
                            node.tagName !==
                            "SCRIPT"
                        ) {

                            continue;

                        }


                        if (
                            originalScripts.has(
                                node
                            )
                        ) {

                            continue;

                        }


                        if (
                            scriptAlertSent
                        ) {

                            continue;

                        }


                        scriptAlertSent =
                            true;


                        sendSecurityAlert(
                            "SCRIPT_TAMPERING",
                            "A new script element was dynamically added to the page.",
                            {

                                script:
                                    node.src ||
                                    (
                                        node.textContent ||
                                        ""
                                    ).slice(
                                        0,
                                        500
                                    ) ||
                                    "Unknown"

                            }
                        );

                    }

                }

            }
        );


    try {

        observer.observe(
            document.documentElement,
            {

                subtree: true,

                childList: true

            }
        );

    } catch (error) {

        console.error(
            "Script monitor error:",
            error
        );

    }

}


// ============================================================
// STORAGE MONITOR
// ============================================================

function initializeStorageMonitor() {

    const initialStorage =
        {};


    try {

        for (
            let i = 0;
            i <
            localStorage.length;
            i++
        ) {

            const key =
                localStorage.key(i);


            if (!key) continue;


            initialStorage[key] =
                localStorage.getItem(
                    key
                );

        }

    } catch {}


    setInterval(
        function() {

            if (
                storageAlertSent
            ) {

                return;

            }


            try {

                const currentStorage =
                    {};


                for (
                    let i = 0;
                    i <
                    localStorage.length;
                    i++
                ) {

                    const key =
                        localStorage.key(i);


                    if (!key) continue;


                    currentStorage[key] =
                        localStorage.getItem(
                            key
                        );

                }


                const allKeys =
                    new Set([
                        ...Object.keys(
                            initialStorage
                        ),
                        ...Object.keys(
                            currentStorage
                        )
                    ]);


                for (
                    const key
                    of allKeys
                ) {

                    if (
                        key.startsWith(
                            "codeshare_"
                        )
                    ) {

                        continue;

                    }


                    if (
                        initialStorage[key] !==
                        currentStorage[key]
                    ) {

                        storageAlertSent =
                            true;


                        sendSecurityAlert(
                            "STORAGE_TAMPERING",
                            "Unexpected localStorage modification detected.",
                            {

                                key:
                                    key

                            }
                        );


                        return;

                    }

                }

            } catch {}

        },
        5000
    );

}


// ============================================================
// NETWORK MONITOR
// ============================================================

function initializeNetworkMonitor() {

    window.addEventListener(
        "online",
        function() {

            handleNetworkChange(
                "ONLINE"
            );

        }
    );


    window.addEventListener(
        "offline",
        function() {

            handleNetworkChange(
                "OFFLINE"
            );

        }
    );

}


function handleNetworkChange(
    status
) {

    if (
        status ===
        lastNetworkStatus
    ) {

        return;

    }


    lastNetworkStatus =
        status;


    if (
        networkAlertSent
    ) {

        return;

    }


    networkAlertSent =
        true;


    sendSecurityAlert(
        "NETWORK_CHANGE",
        "Browser network connection status changed.",
        {

            status:
                status

        }
    );


    setTimeout(
        function() {

            networkAlertSent =
                false;

        },
        60000
    );

}


// ============================================================
// VISIBILITY
// ============================================================

function initializeVisibilityMonitor() {

    document.addEventListener(
        "visibilitychange",
        function() {

            if (
                document.visibilityState ===
                "visible"
            ) {

                detectDevTools();

            }

        }
    );

}


// ============================================================
// MANUAL TEST
// ============================================================

window.testSecurityAlert =
    async function() {

        return await sendSecurityAlert(
            "SECURITY_TEST",
            "Manual CodeShare security alert test."
        );

    };


// ============================================================
// MANUAL ALERT API
// ============================================================

window.sendCodeShareSecurityAlert =
    sendSecurityAlert;


// ============================================================
// START
// ============================================================

function initializeSecuritySystem() {

    if (
        securityStarted
    ) {

        return;

    }


    securityStarted =
        true;


    initializeAuthMonitor();

    initializeRegistrationMonitor();

    initializeUnauthorizedAccessMonitor();

    initializeKeyboardMonitor();

    initializeDevToolsMonitor();

    initializeDOMMonitor();

    initializeTitleMonitor();

    initializeScriptMonitor();

    initializeStorageMonitor();

    initializeNetworkMonitor();

    initializeVisibilityMonitor();


    console.log(
        "CodeShare Security Alert System v6.0 started."
    );

}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSecuritySystem,
        {
            once: true
        }
    );

} else {

    initializeSecuritySystem();

}


// ============================================================
// END
// ============================================================