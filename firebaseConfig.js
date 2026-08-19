// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { Firestore, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOV0S8IMzNOCB2bThsCGwYxk8v68rBZtA",
  authDomain: "tcchat-13e85.firebaseapp.com",
  projectId: "tcchat-13e85",
  storageBucket: "tcchat-13e85.firebasestorage.app",
  messagingSenderId: "97372432150",
  appId: "1:97372432150:web:819031294673680c389237",
  measurementId: "G-CYL1N0B9LN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app)

export {app, firebaseConfig, db}

//https://firebase.google.com/docs/web/setup?hl=pt-br

//teste
