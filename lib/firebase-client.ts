/**
 * Firebase Client SDK (browser-safe).
 *
 * Only non-sensitive, public configuration is used here.
 * The Admin SDK is kept entirely server-side in lib/firebase-admin.ts.
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let clientApp: FirebaseApp;

export function getClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  clientApp = initializeApp(firebaseConfig);
  return clientApp;
}
