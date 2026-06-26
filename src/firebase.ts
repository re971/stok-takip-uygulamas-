import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCov0SYVmAPV2dO2utNgBC8j5yzBNXq-V0",
  authDomain: "ferrous-chalice-txnr0.firebaseapp.com",
  projectId: "ferrous-chalice-txnr0",
  storageBucket: "ferrous-chalice-txnr0.firebasestorage.app",
  messagingSenderId: "661403664797",
  appId: "1:661403664797:web:19a3a49fdf55fb9655ef74"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided in the configuration
export const db = getFirestore(app, "ai-studio-bb801250-57d6-407d-b5e8-dc8e7c3cf852");
