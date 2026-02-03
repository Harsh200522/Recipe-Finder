// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz1rJmOJE6LTVXdBBaI-TG1Xy50T_BVQc",
  authDomain: "recipe-finder-37155.firebaseapp.com",
  projectId: "recipe-finder-37155",
  storageBucket: "recipe-finder-37155.firebasestorage.app",
  messagingSenderId: "290364362380",
  appId: "1:290364362380:web:dde873acbbafdaa5afb5a9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
