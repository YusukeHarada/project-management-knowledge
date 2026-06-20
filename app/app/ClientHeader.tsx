"use client"

import { useAuth } from "@/contexts/AuthContext"
import { isAdmin } from "@/lib/utils/admin"

export default function ClientHeader() {
    const { user } = useAuth()
    const admin = isAdmin(user?.email)
    const isFirestore = process.env.NEXT_PUBLIC_DB_BACKEND === "firestore"

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <nav className="max-w-6xl mx-auto flex items-center gap-6">
                <a href="/" className="font-bold text-lg text-blue-700">スキル診断</a>
                <a href="/dashboard/team" className="text-sm text-gray-600 hover:text-gray-900">チームダッシュボード</a>
                {admin && (
                    <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">マスタ管理</a>
                )}
                {/* Firestore モード: ログイン中のユーザー名と設定リンクを表示 */}
                {isFirestore && user && (
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-sm text-gray-500">{user.displayName || user.email}</span>
                        <a href="/settings" className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1">
                            設定
                        </a>
                    </div>
                )}
            </nav>
        </header>
    )
}
