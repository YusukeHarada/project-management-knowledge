"use client"

import { useEffect, useState } from "react"
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip,
} from "recharts"
import type { User, Category, SkillItem, RoleTarget, Role } from "@/types"

const ROLE_LABELS: Record<Role, string> = { developer: "開発者", pl: "PL", pm: "PM", promoter: "推進者" }

const LEVEL_BG: Record<number, string> = {
    0: "bg-gray-100 text-gray-400",
    1: "bg-yellow-100 text-yellow-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-green-100 text-green-700",
}

interface FullAssessment {
    userId: string
    skillItemId: string
    currentLevel: number
    userName: string
    userRole: Role
}

export default function TeamDashboard() {
    const [users, setUsers] = useState<User[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [skillItems, setSkillItems] = useState<SkillItem[]>([])
    const [roleTargets, setRoleTargets] = useState<RoleTarget[]>([])
    const [assessments, setAssessments] = useState<FullAssessment[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string>("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    useEffect(() => {
        Promise.all([
            fetch("/api/users").then((r) => r.json()),
            fetch("/api/master").then((r) => r.json()),
            fetch("/api/assessments").then((r) => r.json()),
        ]).then(([us, master, ass]) => {
            if (master.error || us.error || ass.error) {
                setFetchError(master.error ?? us.error ?? ass.error ?? "API エラー")
                setLoading(false)
                return
            }
            setUsers(Array.isArray(us) ? us : [])
            setCategories(Array.isArray(master.categories) ? master.categories : [])
            setSkillItems(Array.isArray(master.skillItems) ? master.skillItems : [])
            setRoleTargets(Array.isArray(master.roleTargets) ? master.roleTargets : [])
            setAssessments(Array.isArray(ass) ? ass : [])
            setLoading(false)
        }).catch((err) => {
            setFetchError(String(err))
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>
    if (fetchError) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-700 font-medium mb-1">サーバーエラー</p>
            <pre className="text-xs text-red-600 whitespace-pre-wrap break-all">{fetchError}</pre>
        </div>
    )

    const assessedUserIds = [...new Set(assessments.map((a) => a.userId))]
    const assessedUsers = users.filter((u) => assessedUserIds.includes(u.id))

    const filteredItems = selectedCategory === "all"
        ? skillItems
        : skillItems.filter((i) => i.categoryId === selectedCategory)

    function getLevel(userId: string, skillItemId: string): number {
        return assessments.find((a) => a.userId === userId && a.skillItemId === skillItemId)?.currentLevel ?? -1
    }

    // カテゴリ別平均
    const categoryAverages = categories.map((cat) => {
        const items = skillItems.filter((i) => i.categoryId === cat.id)
        const allLevels = assessedUsers.flatMap((u) =>
            items.map((i) => getLevel(u.id, i.id)).filter((lv) => lv >= 0)
        )
        const avg = allLevels.length > 0 ? allLevels.reduce((s, v) => s + v, 0) / allLevels.length : null

        // チーム平均目標（各ユーザーのロール別目標レベルの平均）
        const targetLevels: number[] = assessedUsers.flatMap((u) =>
            items.map((i) => (roleTargets.find((t) => t.skillItemId === i.id && t.role === u.role)?.targetLevel ?? 0) as number)
        )
        const avgTarget = targetLevels.length > 0 ? targetLevels.reduce((s, v) => s + v, 0) / targetLevels.length : 0

        return { ...cat, avg, avgTarget }
    })

    // レーダーチャートデータ
    const radarData = categoryAverages
        .filter((c) => c.avg !== null)
        .map((c) => ({
            subject: c.name.replace(/（.*）/, "").substring(0, 10),
            チーム平均: Math.round((c.avg ?? 0) * 10) / 10,
            目標平均: Math.round(c.avgTarget * 10) / 10,
        }))

    // 弱点項目（チーム平均が1未満）
    const weakItems = skillItems.map((item) => {
        const levels = assessedUsers.map((u) => getLevel(u.id, item.id)).filter((lv) => lv >= 0)
        const avg = levels.length > 0 ? levels.reduce((s, v) => s + v, 0) / levels.length : null
        return { ...item, avg }
    }).filter((i) => i.avg !== null && i.avg < 1).sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">チームダッシュボード</h1>
                <p className="text-sm text-gray-500">評価済みメンバー: {assessedUsers.length}名</p>
            </div>

            {assessedUsers.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-700">まだ診断結果がありません。<a href="/" className="underline">トップページ</a>から診断を開始してください。</p>
                </div>
            )}

            {/* チームレーダーチャート */}
            {radarData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">カテゴリ別チームスキルレーダー</h2>
                    <ResponsiveContainer width="100%" height={380}>
                        <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                            <Radar name="チーム平均" dataKey="チーム平均" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                            <Radar name="目標平均" dataKey="目標平均" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="4 2" />
                            <Legend />
                            <Tooltip formatter={(v) => `Lv${v}`} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* カテゴリ別平均スコア */}
            {assessedUsers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">カテゴリ別チーム平均</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {categoryAverages.map((cat) => (
                            <div key={cat.id} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1 leading-tight">{cat.name.replace(/（.*）/, "").substring(0, 10)}</div>
                                <div className={`text-2xl font-bold ${cat.avg === null ? "text-gray-300" : cat.avg < 1 ? "text-red-500" : cat.avg < 2 ? "text-yellow-500" : "text-blue-600"}`}>
                                    {cat.avg === null ? "—" : cat.avg.toFixed(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 弱点サマリ */}
            {weakItems.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">チームの弱点（平均 Lv1未満）</h2>
                    <div className="space-y-2">
                        {weakItems.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-100">
                                <span className="text-xs font-mono text-gray-400 w-8 shrink-0">{item.number}</span>
                                <span className="text-sm text-gray-800 flex-1">{item.label}</span>
                                <span className="text-sm font-bold text-red-500 shrink-0">平均 {item.avg?.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ヒートマップ */}
            {assessedUsers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">スキルヒートマップ</h2>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">全カテゴリ</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="text-xs">
                            <thead>
                                <tr>
                                    <th className="text-left pr-3 py-1 font-medium text-gray-500 w-8">番号</th>
                                    <th className="text-left pr-4 py-1 font-medium text-gray-500 max-w-xs">評価項目</th>
                                    {assessedUsers.map((u) => (
                                        <th key={u.id} className="text-center py-1 px-1 font-medium text-gray-700 min-w-[3rem]">
                                            <a href={`/dashboard/${u.id}`} className="hover:underline text-blue-600">
                                                <div>{u.name.substring(0, 4)}</div>
                                                <div className="text-gray-400 font-normal">{ROLE_LABELS[u.role].substring(0, 2)}</div>
                                            </a>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="border-t border-gray-50">
                                        <td className="pr-3 py-1 font-mono text-gray-400">{item.number}</td>
                                        <td className="pr-4 py-1 text-gray-700 max-w-xs truncate" title={item.label}>{item.label}</td>
                                        {assessedUsers.map((u) => {
                                            const lv = getLevel(u.id, item.id)
                                            return (
                                                <td key={u.id} className="text-center py-1 px-1">
                                                    {lv >= 0 ? (
                                                        <span className={`inline-block w-8 h-6 leading-6 rounded text-xs font-bold ${LEVEL_BG[lv]}`}>
                                                            {lv}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block w-8 h-6 leading-6 rounded text-xs text-gray-200">—</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
