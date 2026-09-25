import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM6-gBgegSqI_iLd1nVadBjoxyUv5rcBo",
  authDomain: "eventqr-5f7f1.firebaseapp.com",
  projectId: "eventqr-5f7f1",
  storageBucket: "eventqr-5f7f1.firebasestorage.app",
  messagingSenderId: "691260420644",
  appId: "1:691260420644:web:1347229849b27fc17e5eb1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const INITIAL_CODE = "K9B3H6V8N2C7X4M1";

async function initAuth() {
  try {
    await setDoc(doc(db, "settings", "adminAuth"), {
      accessCode: INITIAL_CODE
    });
    console.log("Successfully initialized auth code:", INITIAL_CODE);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

initAuth();
