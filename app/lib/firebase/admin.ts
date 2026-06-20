import { getApps, initializeApp, getApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

function initAdminApp() {
    if (getApps().length > 0) return getApp()

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set")
    }

    const parsed = JSON.parse(serviceAccountKey)

    // Vercel の環境変数では private_key の \n がエスケープされたまま渡されることがある
    if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n")
    }

    return initializeApp({ credential: cert(parsed) })
}

export function adminDb() {
    initAdminApp()
    return getFirestore()
}

export function adminAuth() {
    initAdminApp()
    return getAuth()
}
