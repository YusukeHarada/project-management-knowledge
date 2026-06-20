"use client"

import dynamic from "next/dynamic"

// Firebase Client SDK は SSR 不可のため ssr: false（firebase-notes.md）
const AuthProviderDynamic = dynamic(
    () => import("@/contexts/AuthContext").then((m) => m.AuthProvider),
    { ssr: false }
)

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return <AuthProviderDynamic>{children}</AuthProviderDynamic>
}
