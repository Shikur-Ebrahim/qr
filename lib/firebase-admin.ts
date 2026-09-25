/**
 * Firebase Admin SDK initialisation (server-side only).
 *
 * This module must NEVER be imported in client-side code.
 * It is protected by Next.js `serverExternalPackages` in next.config.ts.
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;
let db: Firestore;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables. " +
        "Ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, " +
        "and FIREBASE_ADMIN_PRIVATE_KEY are set."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Vercel stores newlines as literal \n in env vars – replace them.
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

export function getAdminFirestore(): Firestore {
  if (!db) {
    const app = getAdminApp();
    db = getFirestore(app);
  }
  return db;
}
