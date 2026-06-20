"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User as FirebaseUser } from "firebase/auth"

interface AuthState {
    user: FirebaseUser | null
    loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Firestore モードでない場合はすぐに解決する
        if (process.env.NEXT_PUBLIC_DB_BACKEND !== "firestore") {
            setLoading(false)
            return
        }

        // Firebase Auth は動的 import でクライアントサイドのみ実行
        import("@/lib/firebase/client").then(({ auth }) => {
            const { onAuthStateChanged } = require("firebase/auth")
            const unsubscribe = onAuthStateChanged(auth, (u: FirebaseUser | null) => {
                setUser(u)
                setLoading(false)
            })
            return unsubscribe
        })
    }, [])

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}
