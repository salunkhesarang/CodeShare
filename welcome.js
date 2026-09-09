// ============================================================
// CodeShare - Welcome Page
// File: js/welcome.js
// ============================================================


// ============================================================
// PAGE ELEMENTS
// ============================================================

const nextButton = document.getElementById("next-btn");
const backButton = document.getElementById("back-btn");
const logoutButton = document.getElementById("welcome-logout");


// ============================================================
// NEXT BUTTON
// ============================================================

if (nextButton) {

    nextButton.addEventListener("click", function () {

        window.location.href = "files.html";

    });

}


// ============================================================
// BACK BUTTON & EMAIL LOADING
// ============================================================
//
// Welcome page ka Back button website se logout karke
// login page par bhejega.
// ============================================================

if (backButton) {

    backButton.addEventListener("click", async function () {

        const confirmed = confirm(
            "Do you want to leave CodeShare?"
        );

        if (!confirmed) {
            return;
        }

        try {

            /*
             * auth.js me Firebase auth instance directly
             * export nahi kiya gaya hai.
             *
             * Isliye logout button ke liye global
             * window.logout() function use kar rahe hain.
             */

            if (typeof window.logout === "function") {

                await window.logout();

            } else {

                window.location.href = "index.html";

            }

        } catch (error) {

            console.error(
                "Welcome Logout Error:",
                error
            );

            window.location.href =
                "index.html";
        }

    });

}


// ============================================================
// LOGOUT BUTTON
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const confirmed = confirm(
                "Are you sure you want to logout?"
            );

            if (!confirmed) {
                return;
            }


            try {

                if (typeof window.logout === "function") {

                    await window.logout();

                } else {

                    window.location.href =
                        "index.html";

                }

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

                window.location.href =
                    "index.html";
            }

        }
    );

}


// ============================================================
// FEATURE CARDS
// ============================================================
//
// Feature cards ko keyboard accessible banaya gaya hai.
// ============================================================

const featureCards =
    document.querySelectorAll(".feature-card");


featureCards.forEach(function (card) {

    card.addEventListener(
        "mouseenter",
        function () {

            card.classList.add("feature-active");

        }
    );


    card.addEventListener(
        "mouseleave",
        function () {

            card.classList.remove("feature-active");

        }
    );

});


// ============================================================
// PAGE LOAD ANIMATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const welcomeBox =
            document.querySelector(".welcome-box");

        if (welcomeBox) {

            welcomeBox.classList.add(
                "welcome-loaded"
            );

        }

    }
);


// ============================================================
// KEYBOARD SHORTCUT
// ============================================================
//
// Enter = Next
// Escape = Logout/Back
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        /*
         * Agar user input/textarea me typing kar raha hai
         * to shortcut execute nahi hoga.
         */

        const tag =
            document.activeElement?.tagName;

        if (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            tag === "SELECT"
        ) {
            return;
        }


        // ENTER -> NEXT

        if (event.key === "Enter") {

            if (nextButton) {

                nextButton.click();

            }

        }


        // ESC -> BACK

        if (event.key === "Escape") {

            if (backButton) {

                backButton.click();

            }

        }

    }
);


// ============================================================
// DEBUG
// ============================================================

console.log(
    "CodeShare welcome.js loaded successfully."
);