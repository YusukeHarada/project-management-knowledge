export type Role = "developer" | "pl" | "pm" | "promoter"

export type Level = 0 | 1 | 2 | 3

export type Priority = "high" | "medium" | "low"

export interface Category {
  id: string
  name: string
  order: number
}

export interface SkillItem {
  id: string
  categoryId: string
  number: string
  label: string
  order: number
}

export interface RoleTarget {
  skillItemId: string
  role: Role
  targetLevel: Level
}

export interface User {
  id: string
  name: string
  role: Role
  createdAt: string
}

export interface Assessment {
  id: string
  userId: string
  skillItemId: string
  currentLevel: Level
  evidence: string
  evaluatedAt: string
}

export interface AssessmentInput {
  skillItemId: string
  currentLevel: Level
  evidence: string
}

export interface SkillItemInput {
  id?: string
  categoryId: string
  number: string
  label: string
  order: number
}

export interface GapAnalysis {
  skillItem: SkillItem
  category: Category
  currentLevel: Level
  targetLevel: Level
  gap: number
  priority: Priority
  suggestedAction: string
}

export interface CategoryScore {
  categoryId: string
  categoryName: string
  averageCurrent: number
  averageTarget: number
}

export interface TeamMemberScore {
  userId: string
  userName: string
  role: Role
  scores: Record<string, Level>
}
