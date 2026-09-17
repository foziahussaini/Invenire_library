
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getFirestore } from "https://console.firebase.google.com/project/invenire-library-60658/firestore/databases/-default-/data";

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCJkv14-pb3coKLOqqcn4gQRiaJ5QA6Jic",
    authDomain: "invenire-library-60658.firebaseapp.com",
    projectId: "invenire-library-60658",
    storageBucket: "invenire-library-60658.firebasestorage.app",
    messagingSenderId: "197150923291",
    appId: "1:197150923291:web:fc14ca988e2630471c76be",
    measurementId: "G-D8TPBP1109"
};

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

  console.log(app);
  console.log(analytics);

  export const db = getFirestore(app);
console.log("Database initialized successfully:", db);
