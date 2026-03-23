import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWnLhou3UvGAcJXLG3aql_nrF9UaTY9ZU",
  authDomain: "cc-benefit-tracker-7019c.firebaseapp.com",
  projectId: "cc-benefit-tracker-7019c",
  storageBucket: "cc-benefit-tracker-7019c.firebasestorage.app",
  messagingSenderId: "816967434747",
  appId: "1:816967434747:web:8191cae7a311fa58d58b5e",
  measurementId: "G-SNKJLD2DYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInAnonymously, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  signInWithPopup, 
  signOut 
};
