// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDsLyeXW_Q12tU_doCFsK4jWykRPhn09c",
  authDomain: "perfect-partners-930b2.firebaseapp.com",
  projectId: "perfect-partners-930b2",
  storageBucket: "perfect-partners-930b2.firebasestorage.app",
  messagingSenderId: "62281594590",
  appId: "1:62281594590:web:8d1a48bc42ec9b9410744f",
  measurementId: "G-S4T589WBME",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth, analytics, app };
