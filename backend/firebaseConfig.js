import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOV0S8IMzNOCB2bThsCGwYxk8v68rBZtA",
  authDomain: "tcchat-13e85.firebaseapp.com",
  projectId: "tcchat-13e85",
  storageBucket: "tcchat-13e85.firebasestorage.app",
  messagingSenderId: "97372432150",
  appId: "1:97372432150:web:819031294673680c389237",
  measurementId: "G-CYL1N0B9LN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
