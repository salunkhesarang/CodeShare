// ============================================================
// CodeShare - Firebase Configuration
// File: js/firebase.js
// ============================================================

// Firebase App
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Firebase Authentication
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Realtime Database
import {
    getDatabase,
    ref
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// ============================================================
// FIREBASE CONFIGURATION
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
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// INITIALIZE AUTHENTICATION
// ============================================================

const auth = getAuth(app);


// ============================================================
// INITIALIZE REALTIME DATABASE
// ============================================================

const database = getDatabase(app);


// ============================================================
// DATABASE REFERENCES
// ============================================================

// Main code files collection
const filesRef = ref(database, "github_files");


// ============================================================
// EXPORT
// ============================================================

export {
    app,
    auth,
    database,
    filesRef
};

