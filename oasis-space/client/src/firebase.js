// client/src/firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "mern-estate.firebaseapp.com",
  projectId: "mern-estate",
  storageBucket: "mern-estate.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);