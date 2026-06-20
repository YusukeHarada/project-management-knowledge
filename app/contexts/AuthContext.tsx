"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User as FirebaseUser } from "firebase/auth"

interface AuthState {
    user: FirebaseUser | null
    loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_DB_BACKEND !== "firestore") {
            setLoading(false)
            return
        }

        import("@/lib/firebase/client").then(({ auth }) => {
            const { onAuthStateChanged } = require("firebase/auth")
            const unsubscribe = onAuthStateChanged(auth, (u: FirebaseUser | null) => {
                setUser(u)
                setLoading(false)
                // 未ログイン かつ ログインページ以外 → /login にリダイレクト
                if (!u && !pathname?.startsWith("/login")) {
                    router.push("/login")
                }
            })
            return unsubscribe
        })
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    // Firestore モードで認証確認中はローディング表示
    if (loading && process.env.NEXT_PUBLIC_DB_BACKEND === "firestore") {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400">
                認証確認中...
            </div>
        )
    }

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}
