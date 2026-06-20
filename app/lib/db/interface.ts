import type {
  Category,
  SkillItem,
  RoleTarget,
  User,
  Assessment,
  AssessmentInput,
  SkillItemInput,
  Role,
} from "@/types"

export interface ISkillRepository {
  // マスタ
  getCategories(): Promise<Category[]>
  getSkillItems(): Promise<SkillItem[]>
  getSkillItemsByCategory(categoryId: string): Promise<SkillItem[]>
  getRoleTargets(): Promise<RoleTarget[]>
  upsertCategory(category: { id?: string; name: string; order: number }): Promise<Category>
  deleteCategory(id: string): Promise<void>
  upsertSkillItem(item: SkillItemInput): Promise<SkillItem>
  deleteSkillItem(id: string): Promise<void>
  upsertRoleTarget(skillItemId: string, role: Role, targetLevel: number): Promise<void>

  // ユーザー
  createUser(name: string, role: Role, id?: string): Promise<User>
  getUserById(id: string): Promise<User | null>
  getAllUsers(): Promise<User[]>

  // 評価
  saveAssessment(userId: string, items: AssessmentInput[]): Promise<void>
  getAssessmentByUser(userId: string): Promise<Assessment[]>
  getLatestAssessmentByUser(userId: string): Promise<Assessment[]>
  getAssessmentSessions(userId: string): Promise<string[]>
  getAssessmentByUserAndDate(userId: string, evaluatedAt: string): Promise<Assessment[]>
  updateAssessmentSession(userId: string, evaluatedAt: string, items: AssessmentInput[]): Promise<void>
  getAllLatestAssessments(): Promise<(Assessment & { userName: string; userRole: Role })[]>
}
