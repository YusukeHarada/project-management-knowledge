import type { Level, Priority, GapAnalysis, CategoryScore, Assessment, SkillItem, Category, RoleTarget, Role } from "@/types"

export function calcGap(currentLevel: Level, targetLevel: Level): number {
  return Math.max(0, targetLevel - currentLevel)
}

export function calcPriority(currentLevel: Level, targetLevel: Level): Priority {
  const gap = calcGap(currentLevel, targetLevel)
  if (gap === 0) return "low"
  if (currentLevel === 0 && targetLevel >= 2) return "high"
  if (currentLevel === 1 && targetLevel === 3) return "medium"
  if (currentLevel >= 2 && targetLevel === 3) return "low"
  if (gap >= 2) return "high"
  return "medium"
}

export function suggestAction(currentLevel: Level, targetLevel: Level): string {
  const gap = calcGap(currentLevel, targetLevel)
  if (gap === 0) return "目標達成済み"
  if (currentLevel === 0) return "OJT・ドキュメント読み込み・勉強会への参加"
  if (currentLevel === 1) return "実案件でのアサイン・ペアワーク・フィードバック付き実施"
  return "後輩へのレクチャー・改善提案の実行・ファシリテーション経験"
}

export function buildGapAnalysis(
  assessments: Assessment[],
  skillItems: SkillItem[],
  categories: Category[],
  roleTargets: RoleTarget[],
  userRole: Role,
): GapAnalysis[] {
  const assessmentMap = new Map(assessments.map((a) => [a.skillItemId, a]))
  const targetMap = new Map(
    roleTargets.filter((t) => t.role === userRole).map((t) => [t.skillItemId, t.targetLevel])
  )
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return skillItems.map((item) => {
    const assessment = assessmentMap.get(item.id)
    const currentLevel = (assessment?.currentLevel ?? 0) as Level
    const targetLevel = (targetMap.get(item.id) ?? 0) as Level
    const category = categoryMap.get(item.categoryId)!

    return {
      skillItem: item,
      category,
      currentLevel,
      targetLevel,
      gap: calcGap(currentLevel, targetLevel),
      priority: calcPriority(currentLevel, targetLevel),
      suggestedAction: suggestAction(currentLevel, targetLevel),
    }
  })
}

export function aggregateCategoryScores(
  gapAnalyses: GapAnalysis[],
  categories: Category[],
): CategoryScore[] {
  return categories.map((cat) => {
    const items = gapAnalyses.filter((g) => g.category.id === cat.id)
    if (items.length === 0) {
      return { categoryId: cat.id, categoryName: cat.name, averageCurrent: 0, averageTarget: 0 }
    }
    const averageCurrent = items.reduce((s, i) => s + i.currentLevel, 0) / items.length
    const averageTarget = items.reduce((s, i) => s + i.targetLevel, 0) / items.length
    return { categoryId: cat.id, categoryName: cat.name, averageCurrent, averageTarget }
  })
}
