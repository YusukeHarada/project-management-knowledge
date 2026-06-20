import { getApps, initializeApp, getApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

function initAdminApp() {
    if (getApps().length > 0) return getApp()

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set")
    }

    return initializeApp({
        credential: cert(JSON.parse(serviceAccountKey)),
    })
}

export function adminDb() {
    initAdminApp()
    return getFirestore()
}

export function adminAuth() {
    initAdminApp()
    return getAuth()
}
