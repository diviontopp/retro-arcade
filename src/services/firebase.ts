// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBE1Wjmhw2mM97YtIGts6pQPOOv3efpQSU",
    authDomain: "retro-arcade-4beb5.firebaseapp.com",
    databaseURL: "https://retro-arcade-4beb5-default-rtdb.firebaseio.com",
    projectId: "retro-arcade-4beb5",
    storageBucket: "retro-arcade-4beb5.firebasestorage.app",
    messagingSenderId: "26579901048",
    appId: "1:26579901048:web:754a0098e7fcae97bd6b8d",
    measurementId: "G-GMCLYPWRPZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);