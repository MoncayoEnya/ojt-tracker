// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getFirestore }  from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyDB8jGoY3NWTbGeHFnP2qTELG6ccRzypqw",
  authDomain:        "ojt-tracker-51ed1.firebaseapp.com",
  projectId:         "ojt-tracker-51ed1",
  storageBucket:     "ojt-tracker-51ed1.firebasestorage.app",
  messagingSenderId: "446065872296",
  appId:             "1:446065872296:web:e1e614fa0535af7e90619d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);