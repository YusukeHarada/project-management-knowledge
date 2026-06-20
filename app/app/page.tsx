"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Role, User } from "@/types"

const ROLE_LABELS: Record<Role, string> = {
    developer: "開発者",
    pl: "PL（プロジェクトリーダー）",
    pm: "PM（プロジェクトマネージャー）",
    promoter: "推進者",
}

type Tab = "new" | "continue"

export default function TopPage() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>("new")

    // 新規登録フォーム
    const [name, setName] = useState("")
    const [role, setRole] = useState<Role>("developer")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // 続きから
    const [users, setUsers] = useState<User[]>([])
    const [selectedUserId, setSelectedUserId] = useState("")
    const [usersLoading, setUsersLoading] = useState(false)

    useEffect(() => {
        if (tab === "continue") {
            setUsersLoading(true)
            fetch("/api/users")
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`)
                    return r.json()
                })
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

            {/* タブ */}
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
                        <p className="text-sm text-gray-500">まだ登録されているユーザーがいません。「新規で始める」から診断を開始してください。</p>
                    )}
                    {!usersLoading && users.length > 0 && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">名前を選択</label>
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
                            </div>
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
                    過去の結果を見る場合は
                    <a href="/dashboard/team" className="text-blue-600 hover:underline ml-1">チームダッシュボード</a>
                    から確認できます
                </p>
            </div>
        </div>
    )
}
