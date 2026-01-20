// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYO_hF4bdC5KhK4qaOeM6R5ujCOTbQqvE",
  authDomain: "pictactoeapp.firebaseapp.com",
  projectId: "pictactoeapp",
  storageBucket: "pictactoeapp.firebasestorage.app",
  messagingSenderId: "923285594789",
  appId: "1:923285594789:web:cd0615fac8cc8a1580a34c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


