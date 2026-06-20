"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Role, User } from "@/types"
import { useAuth } from "@/contexts/AuthContext"

const ROLE_LABELS: Record<Role, string> = {
    developer: "開発者",
    pl: "PL（プロジェクトリーダー）",
    pm: "PM（プロジェクトマネージャー）",
    promoter: "推進者",
}

type Tab = "new" | "continue"

// ---- Firestore モード用コンポーネント ----
function FirestoreTopPage() {
    const router = useRouter()
    const { user: firebaseUser } = useAuth()
    const [existingUser, setExistingUser] = useState<User | null>(null)
    const [showRoleSelect, setShowRoleSelect] = useState(false)
    const [role, setRole] = useState<Role>("developer")
    const [displayNameInput, setDisplayNameInput] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!firebaseUser) return
        fetch(`/api/users?uid=${firebaseUser.uid}`)
            .then((r) => r.json())
            .then((data) => {
                if (data && data.id) {
                    setExistingUser(data)
                } else {
                    setShowRoleSelect(true)
                }
                setLoading(false)
            })
            .catch(() => { setShowRoleSelect(true); setLoading(false) })
    }, [firebaseUser])

    useEffect(() => {
        if (firebaseUser && !displayNameInput) {
            setDisplayNameInput(firebaseUser.displayName || "")
        }
    }, [firebaseUser, displayNameInput])

    async function handleStart() {
        if (existingUser) {
            router.push(`/assessment?userId=${existingUser.id}`)
            return
        }
        if (!firebaseUser) return
        setSaving(true)
        const name = displayNameInput.trim() || firebaseUser.displayName || firebaseUser.email || "ユーザー"
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, role, uid: firebaseUser.uid }),
        })
        const user = await res.json()
        router.push(`/assessment?userId=${user.id}`)
    }

    if (loading) return <div className="text-center py-20 text-gray-500">確認中...</div>

    const displayName = firebaseUser?.displayName || firebaseUser?.email || ""

    return (
        <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">スキル診断</h1>
                <p className="text-gray-600">
                    組み込みSW開発チームのスキル自己評価ツールです。<br />
                    10カテゴリ・53項目について現状レベルを入力してください。
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                {existingUser ? (
                    <div className="text-center space-y-4">
                        <p className="text-gray-700">
                            <span className="font-semibold">{existingUser.name}</span>さん（{ROLE_LABELS[existingUser.role].split("（")[0]}）として登録済みです
                        </p>
                        <button
                            onClick={handleStart}
                            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
                        >
                            診断を開始する
                        </button>
                        <a href={`/dashboard/${existingUser.id}`} className="block text-sm text-blue-600 hover:underline">
                            前回の結果を見る
                        </a>
                    </div>
                ) : showRoleSelect ? (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                            <input
                                type="text"
                                value={displayNameInput}
                                onChange={(e) => setDisplayNameInput(e.target.value)}
                                placeholder={firebaseUser?.displayName || firebaseUser?.email || "お名前を入力"}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">アプリ内での表示名です。後から設定で変更できます。</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ロールを選択してください</label>
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
                            onClick={handleStart}
                            disabled={saving}
                            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? "登録中..." : "診断を開始する"}
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="mt-6 text-center">
                <a href="/dashboard/team" className="text-sm text-blue-600 hover:underline">チームダッシュボードを見る</a>
            </div>
        </div>
    )
}

// ---- SQLite モード用コンポーネント（認証なし）----
function SqliteTopPage() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>("new")
    const [name, setName] = useState("")
    const [role, setRole] = useState<Role>("developer")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [selectedUserId, setSelectedUserId] = useState("")
    const [usersLoading, setUsersLoading] = useState(false)

    useEffect(() => {
        if (tab === "continue") {
            setUsersLoading(true)
            fetch("/api/users")
                .then((r) => r.json())
                .then((data: User[]) => {
                    setUsers(Array.isArray(data) ? data : [])
                    if (data.length > 0) setSelectedUserId(data[0].id)
                })
                .catch((err) => console.error("ユーザー一覧の取得に失敗:", err))
                .finally(() => setUsersLoading(false))
        }
    }, [tab])

    async function handleStart(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) { setError("名前を入力してください"); return }
        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), role }),
            })
            if (!res.ok) throw new Error()
            const user = await res.json()
            router.push(`/assessment?userId=${user.id}`)
        } catch {
            setError("エラーが発生しました。再度お試しください。")
        } finally {
            setLoading(false)
        }
    }

    function handleContinue() {
        if (!selectedUserId) return
        router.push(`/assessment?userId=${selectedUserId}`)
    }

    return (
        <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">スキル診断</h1>
                <p className="text-gray-600">
                    組み込みSW開発チームのスキル自己評価ツールです。<br />
                    10カテゴリ・53項目について現状レベルを入力してください。
                </p>
            </div>

            <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
                <button
                    onClick={() => setTab("new")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "new" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                    新規で始める
                </button>
                <button
                    onClick={() => setTab("continue")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "continue" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                    続きから診断する
                </button>
            </div>

            {tab === "new" && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="text-lg font-semibold mb-6">まず自己紹介してください</h2>
                    <form onSubmit={handleStart} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例：山田 太郎"
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
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "処理中..." : "診断を開始する"}
                        </button>
                    </form>
                </div>
            )}

            {tab === "continue" && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="text-lg font-semibold mb-6">過去の診断を続ける</h2>
                    {usersLoading && <p className="text-sm text-gray-500">読み込み中...</p>}
                    {!usersLoading && users.length === 0 && (
                        <p className="text-sm text-gray-500">まだ登録されているユーザーがいません。</p>
                    )}
                    {!usersLoading && users.length > 0 && (
                        <div className="space-y-5">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}（{ROLE_LABELS[u.role].split("（")[0]}）— {new Date(u.createdAt).toLocaleDateString("ja-JP")}登録
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleContinue}
                                disabled={!selectedUserId}
                                className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                この人で診断を続ける
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    過去の結果は
                    <a href="/dashboard/team" className="text-blue-600 hover:underline ml-1">チームダッシュボード</a>
                    から確認できます
                </p>
            </div>
        </div>
    )
}

// ---- ルートコンポーネント: モード分岐 ----
export default function TopPage() {
    if (process.env.NEXT_PUBLIC_DB_BACKEND === "firestore") {
        return <FirestoreTopPage />
    }
    return <SqliteTopPage />
}
