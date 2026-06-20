"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ROLE_LABELS = {
  developer: "開発者",
  pl: "PL（プロジェクトリーダー）",
  promoter: "推進者",
} as const

type Role = keyof typeof ROLE_LABELS

export default function TopPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [role, setRole] = useState<Role>("developer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("名前を入力してください")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role }),
      })
      if (!res.ok) throw new Error("ユーザー作成に失敗しました")
      const user = await res.json()
      router.push(`/assessment?userId=${user.id}`)
    } catch {
      setError("エラーが発生しました。再度お試しください。")
    } finally {
      setLoading(false)
    }
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

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">まず自己紹介してください</h2>
        <form onSubmit={handleStart} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
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
