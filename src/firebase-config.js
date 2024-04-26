// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

// TODO: create dotenv file and add firebase config

// function StartFirebase() {
const firebaseConfig = {
  apiKey: "AIzaSyDj3XCFKX5qlUrcMq0VAHxJ6fcK8cPCISs",
  authDomain: "major-notice-board-294fc.firebaseapp.com",
  databaseURL: "https://major-notice-board-294fc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "major-notice-board-294fc",
  storageBucket: "major-notice-board-294fc.appspot.com",
  messagingSenderId: "259970307823",
  appId: "1:259970307823:web:943715ca7711be9c4fad1a",
  measurementId: "G-D4ZQHV2ZT2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

// }

export { database, auth, app, firestore };
