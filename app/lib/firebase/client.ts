import { getApps, getApp, initializeApp } from "firebase/app"
import {
    initializeAuth,
    browserLocalPersistence,
    indexedDBLocalPersistence,
    browserPopupRedirectResolver,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// HMR で二重初期化しないようにガードする
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// signInWithPopup に browserPopupRedirectResolver を明示指定（firebase-notes.md）
export const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
})

export const db = getFirestore(app)
