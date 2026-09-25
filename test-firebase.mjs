import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM6-gBgegSqI_iLd1nVadBjoxyUv5rcBo",
  authDomain: "eventqr-5f7f1.firebaseapp.com",
  projectId: "eventqr-5f7f1",
  storageBucket: "eventqr-5f7f1.firebasestorage.app",
  messagingSenderId: "691260420644",
  appId: "1:691260420644:web:1347229849b27fc17e5eb1",
};

console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log("Attempting to write to Firestore...");
    const testDoc = doc(collection(db, "tickets"), "test-connection");
    await setDoc(testDoc, { status: "TEST" });
    console.log("Write successful!");

    console.log("Attempting to read from Firestore...");
    const snap = await getDocs(collection(db, "tickets"));
    console.log(`Read successful! Found ${snap.docs.length} documents.`);
    process.exit(0);
  } catch (error) {
    console.error("Firebase connection error:", error);
    process.exit(1);
  }
}

testFirebase();
