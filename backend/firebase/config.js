import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { connectFirestoreEmulator, getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { connectAuthEmulator, getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

let useEmulators = false;
if (typeof window !== "undefined") {
  try {
    useEmulators = localStorage.getItem("tcchat.useFirebaseEmulators") === "true";
  } catch {
    useEmulators = false;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyBOV0S8IMzNOC2bThsCGwYxk8v68rBZtA",
  authDomain: "tcchat-13e85.firebaseapp.com",
  projectId: useEmulators ? "demo-tcchat" : "tcchat-13e85",
  storageBucket: "tcchat-13e85.firebasestorage.app",
  messagingSenderId: "97372432150",
  appId: "1:97372432150:web:819031294673680c389237",
  measurementId: "G-CYL1N0B9LN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { app, db, auth };
