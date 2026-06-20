import { describe, it, expect } from "vitest"
import { calcGap, calcPriority, suggestAction, buildGapAnalysis, aggregateCategoryScores } from "./scoring"
import type { Assessment, SkillItem, Category, RoleTarget } from "@/types"

describe("calcGap", () => {
  it("目標より現状が低い場合ギャップを返す", () => {
    expect(calcGap(0, 2)).toBe(2)
    expect(calcGap(1, 3)).toBe(2)
    expect(calcGap(2, 3)).toBe(1)
  })
  it("現状が目標以上の場合0を返す", () => {
    expect(calcGap(2, 2)).toBe(0)
    expect(calcGap(3, 2)).toBe(0)
  })
})

describe("calcPriority", () => {
  it("Lv0→Lv2以上は優先度高", () => {
    expect(calcPriority(0, 2)).toBe("high")
    expect(calcPriority(0, 3)).toBe("high")
  })
  it("Lv1→Lv3は優先度中", () => {
    expect(calcPriority(1, 3)).toBe("medium")
  })
  it("Lv2→Lv3は優先度低", () => {
    expect(calcPriority(2, 3)).toBe("low")
  })
  it("目標達成済みは優先度低", () => {
    expect(calcPriority(3, 3)).toBe("low")
    expect(calcPriority(2, 2)).toBe("low")
  })
})

describe("suggestAction", () => {
  it("Lv0の場合はOJT系アクション", () => {
    expect(suggestAction(0, 2)).toContain("OJT")
  })
  it("Lv1の場合は実践系アクション", () => {
    expect(suggestAction(1, 3)).toContain("実案件")
  })
  it("Lv2の場合は指導系アクション", () => {
    expect(suggestAction(2, 3)).toContain("レクチャー")
  })
  it("目標達成済みは達成メッセージ", () => {
    expect(suggestAction(3, 3)).toBe("目標達成済み")
  })
})

describe("buildGapAnalysis", () => {
  const categories: Category[] = [{ id: "cat1", name: "プロセス理解", order: 1 }]
  const skillItems: SkillItem[] = [
    { id: "1-1", categoryId: "cat1", number: "1-1", label: "テスト項目A", order: 1 },
    { id: "1-2", categoryId: "cat1", number: "1-2", label: "テスト項目B", order: 2 },
  ]
  const roleTargets: RoleTarget[] = [
    { skillItemId: "1-1", role: "developer", targetLevel: 2 },
    { skillItemId: "1-2", role: "developer", targetLevel: 1 },
  ]
  const assessments: Assessment[] = [
    { id: "a1", userId: "u1", skillItemId: "1-1", currentLevel: 0, evidence: "", evaluatedAt: "" },
  ]

  it("評価済み項目のギャップを正しく計算する", () => {
    const result = buildGapAnalysis(assessments, skillItems, categories, roleTargets, "developer")
    const item1 = result.find((g) => g.skillItem.id === "1-1")!
    expect(item1.currentLevel).toBe(0)
    expect(item1.targetLevel).toBe(2)
    expect(item1.gap).toBe(2)
    expect(item1.priority).toBe("high")
  })

  it("未評価項目はLv0として扱う", () => {
    const result = buildGapAnalysis(assessments, skillItems, categories, roleTargets, "developer")
    const item2 = result.find((g) => g.skillItem.id === "1-2")!
    expect(item2.currentLevel).toBe(0)
    expect(item2.gap).toBe(1)
  })
})

describe("aggregateCategoryScores", () => {
  it("カテゴリ別の平均スコアを返す", () => {
    const categories: Category[] = [{ id: "cat1", name: "テスト", order: 1 }]
    const skillItems: SkillItem[] = [
      { id: "1-1", categoryId: "cat1", number: "1-1", label: "A", order: 1 },
      { id: "1-2", categoryId: "cat1", number: "1-2", label: "B", order: 2 },
    ]
    const roleTargets: RoleTarget[] = [
      { skillItemId: "1-1", role: "developer", targetLevel: 2 },
      { skillItemId: "1-2", role: "developer", targetLevel: 2 },
    ]
    const assessments: Assessment[] = [
      { id: "a1", userId: "u1", skillItemId: "1-1", currentLevel: 1, evidence: "", evaluatedAt: "" },
      { id: "a2", userId: "u1", skillItemId: "1-2", currentLevel: 3, evidence: "", evaluatedAt: "" },
    ]
    const gaps = buildGapAnalysis(assessments, skillItems, categories, roleTargets, "developer")
    const scores = aggregateCategoryScores(gaps, categories)
    expect(scores[0].averageCurrent).toBe(2)
    expect(scores[0].averageTarget).toBe(2)
  })
})
