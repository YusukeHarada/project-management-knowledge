"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Category, SkillItem, RoleTarget, User, Assessment, Role, Level } from "@/types"

const LEVEL_LABELS: Record<number, { name: string; color: string }> = {
    0: { name: "Lv0 未経験", color: "bg-gray-100 text-gray-600 border-gray-300" },
    1: { name: "Lv1 見習い", color: "bg-yellow-50 text-yellow-700 border-yellow-300" },
    2: { name: "Lv2 自立", color: "bg-blue-50 text-blue-700 border-blue-300" },
    3: { name: "Lv3 熟練", color: "bg-green-50 text-green-700 border-green-300" },
}

const ROLE_LABELS: Record<Role, string> = {
    developer: "開発者",
    pl: "PL",
    pm: "PM",
    promoter: "推進者",
}

interface AssessmentState {
    currentLevel: Level
    evidence: string
}

function AssessmentContent() {
    const router = useRouter()
    const params = useSearchParams()
    const userId = params.get("userId")

    const [user, setUser] = useState<User | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [skillItems, setSkillItems] = useState<SkillItem[]>([])
    const [roleTargets, setRoleTargets] = useState<RoleTarget[]>([])
    const [answers, setAnswers] = useState<Record<string, AssessmentState>>({})
    const [activeCategory, setActiveCategory] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) { router.push("/"); return }
        Promise.all([
            fetch(`/api/users`).then((r) => r.json()),
            fetch("/api/master").then((r) => r.json()),
            fetch(`/api/assessments?userId=${userId}`).then((r) => r.json()),
        ]).then(([users, master, existingAssessments]: [User[], { categories: Category[]; skillItems: SkillItem[]; roleTargets: RoleTarget[] }, Assessment[]]) => {
            const found = users.find((u) => u.id === userId)
            if (!found) { router.push("/"); return }
            setUser(found)
            setCategories(master.categories)
            setSkillItems(master.skillItems)
            setRoleTargets(master.roleTargets)
            if (master.categories.length > 0) setActiveCategory(master.categories[0].id)

            // 既存の評価で初期化（前回値を pre-fill）
            const initial: Record<string, AssessmentState> = {}
            for (const item of master.skillItems) {
                const prev = existingAssessments.find((a) => a.skillItemId === item.id)
                initial[item.id] = { currentLevel: (prev?.currentLevel ?? 0) as Level, evidence: prev?.evidence ?? "" }
            }
            setAnswers(initial)
            setLoading(false)
        })
    }, [userId, router])

    function getTargetLevel(skillItemId: string): number {
        if (!user) return 0
        return roleTargets.find((t) => t.skillItemId === skillItemId && t.role === user.role)?.targetLevel ?? 0
    }

    function setLevel(skillItemId: string, level: Level) {
        setAnswers((prev) => ({ ...prev, [skillItemId]: { ...prev[skillItemId], currentLevel: level } }))
    }

    function setEvidence(skillItemId: string, evidence: string) {
        setAnswers((prev) => ({ ...prev, [skillItemId]: { ...prev[skillItemId], evidence } }))
    }

    async function handleSubmit() {
        if (!userId) return
        setSubmitting(true)
        const items = Object.entries(answers).map(([skillItemId, state]) => ({
            skillItemId,
            currentLevel: state.currentLevel,
            evidence: state.evidence,
        }))
        await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, items }),
        })
        router.push(`/dashboard/${userId}`)
    }

    function goToNextCategory() {
        const idx = categories.findIndex((c) => c.id === activeCategory)
        if (idx < categories.length - 1) {
            setActiveCategory(categories[idx + 1].id)
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    const completedCount = Object.values(answers).filter((a) => a.currentLevel > 0 || a.evidence).length
    const totalCount = skillItems.length

    if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>

    const currentItems = skillItems.filter((i) => i.categoryId === activeCategory)
    const activeCategoryIndex = categories.findIndex((c) => c.id === activeCategory)
    const isLastCategory = activeCategoryIndex === categories.length - 1

    return (
        <div className="flex gap-6">
            {/* サイドバー：カテゴリ一覧 */}
            <aside className="w-56 shrink-0">
                <div className="sticky top-6 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 px-2 mb-2">カテゴリ</p>
                    {categories.map((cat) => {
                        const items = skillItems.filter((i) => i.categoryId === cat.id)
                        const answered = items.filter((i) => answers[i.id]?.currentLevel > 0 || answers[i.id]?.evidence).length
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${activeCategory === cat.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                                <span className="block font-medium leading-snug">{cat.name}</span>
                                <span className={`text-xs ${activeCategory === cat.id ? "text-blue-100" : "text-gray-400"}`}>
                                    {answered}/{items.length}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* メインエリア */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold">{user?.name} さんのスキル診断</h1>
                        <p className="text-sm text-gray-500">ロール：{user ? ROLE_LABELS[user.role] : ""} / 回答済み {completedCount}/{totalCount}</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? "保存中..." : "結果を保存する"}
                    </button>
                </div>

                <div className="space-y-4">
                    {currentItems.map((item) => {
                        const answer = answers[item.id] ?? { currentLevel: 0, evidence: "" }
                        const targetLevel = getTargetLevel(item.id)
                        return (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <span className="text-xs font-mono text-gray-400 mr-2">{item.number}</span>
                                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                    </div>
                                    <div className="shrink-0 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                                        目標 Lv{targetLevel}
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {([0, 1, 2, 3] as Level[]).map((lv) => (
                                        <button
                                            key={lv}
                                            onClick={() => setLevel(item.id, lv)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                answer.currentLevel === lv
                                                    ? `${LEVEL_LABELS[lv].color} border-current ring-2 ring-offset-1 ring-current`
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                            }`}
                                        >
                                            {LEVEL_LABELS[lv].name}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    value={answer.evidence}
                                    onChange={(e) => setEvidence(item.id, e.target.value)}
                                    placeholder="根拠・エビデンス（任意）例：○○設計書を作成、○○レビューで指摘"
                                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="mt-6 flex justify-between items-center">
                    {!isLastCategory ? (
                        <button
                            onClick={goToNextCategory}
                            className="text-blue-600 border border-blue-300 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors"
                        >
                            次のカテゴリへ →
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? "保存中..." : "結果を保存してダッシュボードへ"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function AssessmentPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-gray-500">読み込み中...</div>}>
            <AssessmentContent />
        </Suspense>
    )
}
