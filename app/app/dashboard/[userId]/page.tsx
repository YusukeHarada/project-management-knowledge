"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
    RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip,
    LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { buildGapAnalysis, aggregateCategoryScores } from "@/lib/domain/scoring"
import type { User, Assessment, Category, SkillItem, RoleTarget, GapAnalysis, CategoryScore, Role, Level } from "@/types"

const ROLE_LABELS: Record<Role, string> = { developer: "開発者", pl: "PL", pm: "PM", promoter: "推進者" }
const PRIORITY_LABELS = { high: { label: "★★★ 優先度高", color: "text-red-600 bg-red-50 border-red-200" }, medium: { label: "★★☆ 優先度中", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }, low: { label: "★☆☆ 優先度低", color: "text-gray-500 bg-gray-50 border-gray-200" } }

const CATEGORY_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#6b7280"]

interface TrendPoint {
    date: string
    [cat: string]: number | string
}

export default function PersonalDashboard() {
    const { userId } = useParams<{ userId: string }>()
    const [user, setUser] = useState<User | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [skillItems, setSkillItems] = useState<SkillItem[]>([])
    const [roleTargets, setRoleTargets] = useState<RoleTarget[]>([])
    const [gapAnalyses, setGapAnalyses] = useState<GapAnalysis[]>([])
    const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([])
    const [sessions, setSessions] = useState<string[]>([])
    const [compareDate, setCompareDate] = useState<string>("")
    const [prevLevels, setPrevLevels] = useState<Record<string, Level>>({})
    const [trendData, setTrendData] = useState<TrendPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch("/api/users").then((r) => r.json()),
            fetch(`/api/assessments?userId=${userId}`).then((r) => r.json()),
            fetch("/api/master").then((r) => r.json()),
            fetch(`/api/assessments?userId=${userId}&sessions=true`).then((r) => r.json()),
        ]).then(([users, assessments, master, sessionDates]: [User[], Assessment[], { categories: Category[]; skillItems: SkillItem[]; roleTargets: RoleTarget[] }, string[]]) => {
            const found = users.find((u) => u.id === userId)
            if (!found) return
            setUser(found)
            setCategories(master.categories)
            setSkillItems(master.skillItems)
            setRoleTargets(master.roleTargets)
            const gaps = buildGapAnalysis(assessments, master.skillItems, master.categories, master.roleTargets, found.role)
            setGapAnalyses(gaps)
            setCategoryScores(aggregateCategoryScores(gaps, master.categories))
            setSessions(sessionDates)
            setLoading(false)
        })
    }, [userId])

    // 前回比較データ取得
    useEffect(() => {
        if (!compareDate) { setPrevLevels({}); return }
        fetch(`/api/assessments?userId=${userId}&date=${encodeURIComponent(compareDate)}`)
            .then((r) => r.json())
            .then((data: Assessment[]) => {
                const map: Record<string, Level> = {}
                for (const a of data) map[a.skillItemId] = a.currentLevel
                setPrevLevels(map)
            })
    }, [compareDate, userId])

    // 推移グラフ: 全履歴から各セッションのカテゴリ平均を計算
    useEffect(() => {
        if (sessions.length < 2 || !user || skillItems.length === 0) return
        fetch(`/api/assessments?userId=${userId}&all=true`)
            .then((r) => r.json())
            .then((allAssessments: Assessment[]) => {
                const points: TrendPoint[] = sessions.slice().reverse().map((sessionDate) => {
                    const sessionAssessments = allAssessments.filter((a) => a.evaluatedAt === sessionDate)
                    const scores = aggregateCategoryScores(
                        buildGapAnalysis(sessionAssessments, skillItems, categories, roleTargets, user.role),
                        categories
                    )
                    const point: TrendPoint = {
                        date: new Date(sessionDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
                    }
                    for (const s of scores) {
                        point[s.categoryName.replace(/（.*）/, "").substring(0, 8)] = Math.round(s.averageCurrent * 10) / 10
                    }
                    return point
                })
                setTrendData(points)
            })
    }, [sessions, user, skillItems, categories, roleTargets, userId])

    if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>
    if (!user) return <div className="text-center py-20 text-gray-500">ユーザーが見つかりません</div>

    const highPriority = gapAnalyses.filter((g) => g.priority === "high" && g.gap > 0)
    const radarData = categoryScores.map((c) => ({
        subject: c.categoryName.replace(/（.*）/, "").substring(0, 10),
        現状: Math.round(c.averageCurrent * 10) / 10,
        目標: Math.round(c.averageTarget * 10) / 10,
    }))

    // 推移グラフ用のカテゴリキー一覧
    const trendCategories = categories.map((c) => c.name.replace(/（.*）/, "").substring(0, 8))

    function formatDate(iso: string) {
        return new Date(iso).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    }

    function renderDelta(skillItemId: string, current: Level) {
        if (!compareDate || !(skillItemId in prevLevels)) return null
        const prev = prevLevels[skillItemId]
        const delta = current - prev
        if (delta > 0) return <span className="text-green-600 font-bold text-xs ml-1">+{delta}</span>
        if (delta < 0) return <span className="text-red-500 font-bold text-xs ml-1">{delta}</span>
        return <span className="text-gray-400 text-xs ml-1">±0</span>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{user.name} さんのスキル診断結果</h1>
                    <p className="text-gray-500 text-sm mt-1">ロール：{ROLE_LABELS[user.role]}</p>
                </div>
                <a
                    href={`/assessment?userId=${userId}`}
                    className="text-sm text-blue-600 border border-blue-300 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors"
                >
                    再診断する
                </a>
            </div>

            {/* レーダーチャート */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">カテゴリ別スキルレーダー</h2>
                <ResponsiveContainer width="100%" height={380}>
                    <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <Radar name="現状" dataKey="現状" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Radar name="目標" dataKey="目標" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="4 2" />
                        <Legend />
                        <Tooltip formatter={(v) => `Lv${v}`} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* 成長トレンドグラフ（2回以上診断時） */}
            {trendData.length >= 2 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">成長トレンド（カテゴリ別推移）</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 11 }} tickFormatter={(v) => `Lv${v}`} />
                            <Tooltip formatter={(v) => `Lv${v}`} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            {trendCategories.map((cat, i) => (
                                <Line
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 優先育成アクション */}
            {highPriority.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">優先育成アクション（ギャップが大きい項目）</h2>
                    <div className="space-y-3">
                        {highPriority.slice(0, 8).map((g) => (
                            <div key={g.skillItem.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <span className="shrink-0 text-xs font-mono text-gray-400 mt-0.5 w-8">{g.skillItem.number}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">{g.skillItem.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">現状 Lv{g.currentLevel} → 目標 Lv{g.targetLevel} / {g.suggestedAction}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 全項目一覧（履歴比較付き） */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">全項目ギャップ一覧</h2>
                    {sessions.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">前回比較:</span>
                            <select
                                value={compareDate}
                                onChange={(e) => setCompareDate(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">比較しない</option>
                                {sessions.slice(1).map((s) => (
                                    <option key={s} value={s}>{formatDate(s)}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500 text-xs">
                                <th className="text-left py-2 pr-3 w-12">番号</th>
                                <th className="text-left py-2 pr-3">評価項目</th>
                                <th className="text-center py-2 pr-3 w-24">現状{compareDate && " (前回比)"}</th>
                                <th className="text-center py-2 pr-3 w-20">目標</th>
                                <th className="text-center py-2 pr-3 w-16">ギャップ</th>
                                <th className="text-left py-2 w-28">優先度</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gapAnalyses.map((g) => (
                                <tr key={g.skillItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 pr-3 font-mono text-xs text-gray-400">{g.skillItem.number}</td>
                                    <td className="py-2 pr-3 text-gray-900 leading-snug">{g.skillItem.label}</td>
                                    <td className="py-2 pr-3 text-center font-medium">
                                        Lv{g.currentLevel}
                                        {renderDelta(g.skillItem.id, g.currentLevel)}
                                    </td>
                                    <td className="py-2 pr-3 text-center text-gray-500">Lv{g.targetLevel}</td>
                                    <td className="py-2 pr-3 text-center font-bold">
                                        {g.gap > 0 ? <span className="text-red-500">−{g.gap}</span> : <span className="text-green-600">達成</span>}
                                    </td>
                                    <td className="py-2">
                                        <span className={`text-xs border rounded px-1.5 py-0.5 ${PRIORITY_LABELS[g.priority].color}`}>
                                            {PRIORITY_LABELS[g.priority].label}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
