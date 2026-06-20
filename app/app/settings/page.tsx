"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { isAdmin } from "@/lib/utils/admin"
import type { Role, User } from "@/types"

const ROLE_LABELS: Record<Role, string> = {
    developer: "開発者",
    pl: "PL（プロジェクトリーダー）",
    pm: "PM（プロジェクトマネージャー）",
    promoter: "推進者",
}

function SettingsContent() {
    const router = useRouter()
    const params = useSearchParams()
    const { user: firebaseUser, loading: authLoading } = useAuth()

    const [user, setUser] = useState<User | null>(null)
    const [name, setName] = useState("")
    const [role, setRole] = useState<Role>("developer")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (authLoading) return

        // Firestore モード: Google UID で取得 / SQLite モード: URL パラメータで取得
        const uid = process.env.NEXT_PUBLIC_DB_BACKEND === "firestore"
            ? firebaseUser?.uid
            : params.get("userId") ?? undefined

        if (!uid) { router.push("/"); return }

        fetch(`/api/users?uid=${uid}`)
            .then((r) => r.json())
            .then((u: User & { error?: string } | null) => {
                if (!u) { router.push("/"); return }
                // API エラー（RESOURCE_EXHAUSTED 等）の場合はリダイレクトせずエラー表示
                if (u.error) {
                    console.error("設定取得エラー:", u.error)
                    setLoading(false)
                    return
                }
                if (!u.id) { router.push("/"); return }
                setUser(u)
                setName(u.name)
                setRole(u.role)
                setLoading(false)
            })
            .catch((err) => {
                console.error("設定取得失敗:", err)
                setLoading(false)
            })
    }, [authLoading, firebaseUser?.uid, params, router])

    async function handleSave() {
        if (!user || !name.trim()) return
        setSaving(true)
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id, name: name.trim(), role }),
        })
        if (res.ok) {
            const updated: User = await res.json()
            setUser(updated)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        }
        setSaving(false)
    }

    async function handleDelete() {
        if (!user) return
        if (!confirm(`「${user.name}」のアカウントを削除しますか？\n診断データもすべて削除されます。この操作は元に戻せません。`)) return
        setDeleting(true)
        await fetch(`/api/users?id=${user.id}`, { method: "DELETE" })
        if (process.env.NEXT_PUBLIC_DB_BACKEND === "firestore") {
            const { auth } = await import("@/lib/firebase/client")
            const { signOut } = await import("firebase/auth")
            await signOut(auth)
        }
        router.push("/")
    }

    if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>
    if (!user) return null

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">ユーザー設定</h1>
                <a
                    href={`/dashboard/${user.id}`}
                    className="text-sm text-blue-600 hover:underline"
                >
                    ダッシュボードに戻る
                </a>
            </div>

            {/* プロフィール設定 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
                <h2 className="text-base font-semibold">プロフィール</h2>

                {firebaseUser?.email && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                        <div className="flex items-center gap-2">
                            <p className="flex-1 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                                {firebaseUser.email}
                            </p>
                            {isAdmin(firebaseUser.email) && (
                                <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 shrink-0">
                                    管理者
                                </span>
                            )}
                        </div>
                        {isAdmin(firebaseUser.email) && (
                            <a href="/admin" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                                → マスタ管理ページへ
                            </a>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ロール</label>
                    <div className="space-y-2">
                        {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                            <label key={value} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value={value}
                                    checked={role === value}
                                    onChange={() => setRole(value)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm text-gray-800">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}
                >
                    {saving ? "保存中..." : saved ? "✓ 保存しました" : "変更を保存する"}
                </button>
            </div>

            {/* アカウント削除 */}
            <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-red-700 mb-2">アカウントの削除</h2>
                <p className="text-sm text-gray-600 mb-4">
                    アカウントを削除すると、すべての診断データが失われます。この操作は元に戻せません。
                </p>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-sm text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                    {deleting ? "削除中..." : "アカウントを削除する"}
                </button>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-500">読み込み中...</div>}>
            <SettingsContent />
        </Suspense>
    )
}
