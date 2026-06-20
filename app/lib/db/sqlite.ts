import Database from "better-sqlite3"
import path from "path"
import { randomUUID } from "crypto"
import type { ISkillRepository } from "./interface"
import type { Category, SkillItem, RoleTarget, User, Assessment, AssessmentInput, SkillItemInput, Role, Level } from "@/types"
import { SEED_CATEGORIES, SEED_SKILL_ITEMS, SEED_ROLE_TARGETS } from "@/lib/domain/seed"

const DB_PATH = path.join(process.cwd(), "data", "skill.db")

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    const fs = require("fs")
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    _db = new Database(DB_PATH)
    _db.pragma("journal_mode = WAL")
    initSchema(_db)
    seedIfEmpty(_db)
    runMigrations(_db)
  }
  return _db
}

function runMigrations(db: Database.Database) {
  // PM ロールの role_targets が存在しない場合、PL の値を使って挿入する
  const pmCount = (db.prepare("SELECT COUNT(*) as c FROM role_targets WHERE role = 'pm'").get() as { c: number }).c
  if (pmCount === 0) {
    const plTargets = db.prepare("SELECT skill_item_id, target_level FROM role_targets WHERE role = 'pl'").all() as { skill_item_id: string; target_level: number }[]
    const insert = db.prepare("INSERT OR IGNORE INTO role_targets (skill_item_id, role, target_level) VALUES (?, 'pm', ?)")
    const migrate = db.transaction(() => {
      for (const t of plTargets) insert.run(t.skill_item_id, t.target_level)
    })
    migrate()
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      \`order\` INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS skill_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      number TEXT NOT NULL,
      label TEXT NOT NULL,
      \`order\` INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS role_targets (
      skill_item_id TEXT NOT NULL REFERENCES skill_items(id),
      role TEXT NOT NULL,
      target_level INTEGER NOT NULL,
      PRIMARY KEY (skill_item_id, role)
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      skill_item_id TEXT NOT NULL REFERENCES skill_items(id),
      current_level INTEGER NOT NULL,
      evidence TEXT NOT NULL DEFAULT '',
      evaluated_at TEXT NOT NULL
    );
  `)
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c
  if (count > 0) return

  const insertCat = db.prepare("INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?)")
  const insertItem = db.prepare("INSERT INTO skill_items (id, category_id, number, label, `order`) VALUES (?, ?, ?, ?, ?)")
  const insertTarget = db.prepare("INSERT INTO role_targets (skill_item_id, role, target_level) VALUES (?, ?, ?)")

  const seedAll = db.transaction(() => {
    for (const c of SEED_CATEGORIES) insertCat.run(c.id, c.name, c.order)
    for (const i of SEED_SKILL_ITEMS) insertItem.run(i.id, i.categoryId, i.number, i.label, i.order)
    for (const t of SEED_ROLE_TARGETS) insertTarget.run(t.skillItemId, t.role, t.targetLevel)
  })
  seedAll()
}

export class SqliteSkillRepository implements ISkillRepository {
  private get db() { return getDb() }

  async getCategories(): Promise<Category[]> {
    return this.db.prepare("SELECT id, name, `order` as `order` FROM categories ORDER BY `order`").all() as Category[]
  }

  async getSkillItems(): Promise<SkillItem[]> {
    const rows = this.db.prepare(`
      SELECT si.id, si.category_id, si.number, si.label, si.\`order\`
      FROM skill_items si
      JOIN categories c ON si.category_id = c.id
      ORDER BY c.\`order\`, si.\`order\`
    `).all() as Record<string, unknown>[]
    return rows.map(rowToSkillItem)
  }

  async getSkillItemsByCategory(categoryId: string): Promise<SkillItem[]> {
    const rows = this.db.prepare("SELECT id, category_id, number, label, `order` FROM skill_items WHERE category_id = ? ORDER BY `order`").all(categoryId) as Record<string, unknown>[]
    return rows.map(rowToSkillItem)
  }

  async getRoleTargets(): Promise<RoleTarget[]> {
    const rows = this.db.prepare("SELECT skill_item_id, role, target_level FROM role_targets").all() as Record<string, unknown>[]
    return rows.map((r) => ({
      skillItemId: r.skill_item_id as string,
      role: r.role as Role,
      targetLevel: r.target_level as Level,
    }))
  }

  async upsertCategory(category: { id?: string; name: string; order: number }): Promise<Category> {
    const id = category.id ?? randomUUID()
    this.db.prepare("INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, `order`=excluded.`order`")
      .run(id, category.name, category.order)
    return { id, name: category.name, order: category.order }
  }

  async deleteCategory(id: string): Promise<void> {
    this.db.prepare("DELETE FROM categories WHERE id = ?").run(id)
  }

  async upsertSkillItem(item: SkillItemInput): Promise<SkillItem> {
    const id = item.id ?? randomUUID()
    this.db.prepare("INSERT INTO skill_items (id, category_id, number, label, `order`) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id, number=excluded.number, label=excluded.label, `order`=excluded.`order`")
      .run(id, item.categoryId, item.number, item.label, item.order)
    return { id, categoryId: item.categoryId, number: item.number, label: item.label, order: item.order }
  }

  async deleteSkillItem(id: string): Promise<void> {
    this.db.prepare("DELETE FROM skill_items WHERE id = ?").run(id)
  }

  async upsertRoleTarget(skillItemId: string, role: Role, targetLevel: number): Promise<void> {
    this.db.prepare("INSERT INTO role_targets (skill_item_id, role, target_level) VALUES (?, ?, ?) ON CONFLICT(skill_item_id, role) DO UPDATE SET target_level=excluded.target_level")
      .run(skillItemId, role, targetLevel)
  }

  async createUser(name: string, role: Role, id?: string): Promise<User> {
    const userId = id ?? randomUUID()
    const createdAt = new Date().toISOString()
    this.db.prepare("INSERT INTO users (id, name, role, created_at) VALUES (?, ?, ?, ?)").run(userId, name, role, createdAt)
    return { id: userId, name, role, createdAt }
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare("SELECT id, name, role, created_at FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return { id: row.id as string, name: row.name as string, role: row.role as Role, createdAt: row.created_at as string }
  }

  async getAllUsers(): Promise<User[]> {
    const rows = this.db.prepare("SELECT id, name, role, created_at FROM users ORDER BY created_at DESC").all() as Record<string, unknown>[]
    return rows.map((r) => ({ id: r.id as string, name: r.name as string, role: r.role as Role, createdAt: r.created_at as string }))
  }

  async updateUser(userId: string, data: { name?: string; role?: Role }): Promise<User> {
    if (data.name !== undefined) {
      this.db.prepare("UPDATE users SET name = ? WHERE id = ?").run(data.name, userId)
    }
    if (data.role !== undefined) {
      this.db.prepare("UPDATE users SET role = ? WHERE id = ?").run(data.role, userId)
    }
    const row = this.db.prepare("SELECT id, name, role, created_at FROM users WHERE id = ?").get(userId) as Record<string, unknown>
    return { id: row.id as string, name: row.name as string, role: row.role as Role, createdAt: row.created_at as string }
  }

  async deleteUser(userId: string): Promise<void> {
    const del = this.db.transaction(() => {
      this.db.prepare("DELETE FROM assessments WHERE user_id = ?").run(userId)
      this.db.prepare("DELETE FROM users WHERE id = ?").run(userId)
    })
    del()
  }

  async saveAssessment(userId: string, items: AssessmentInput[]): Promise<void> {
    const insert = this.db.prepare("INSERT INTO assessments (id, user_id, skill_item_id, current_level, evidence, evaluated_at) VALUES (?, ?, ?, ?, ?, ?)")
    const now = new Date().toISOString()
    const save = this.db.transaction(() => {
      for (const item of items) {
        insert.run(randomUUID(), userId, item.skillItemId, item.currentLevel, item.evidence, now)
      }
    })
    save()
  }

  async getAssessmentByUser(userId: string): Promise<Assessment[]> {
    const rows = this.db.prepare("SELECT id, user_id, skill_item_id, current_level, evidence, evaluated_at FROM assessments WHERE user_id = ? ORDER BY evaluated_at DESC").all(userId) as Record<string, unknown>[]
    return rows.map(rowToAssessment)
  }

  async getLatestAssessmentByUser(userId: string): Promise<Assessment[]> {
    // 各スキル項目の最新評価のみ返す
    const rows = this.db.prepare(`
      SELECT a.id, a.user_id, a.skill_item_id, a.current_level, a.evidence, a.evaluated_at
      FROM assessments a
      INNER JOIN (
        SELECT skill_item_id, MAX(evaluated_at) as max_at
        FROM assessments WHERE user_id = ?
        GROUP BY skill_item_id
      ) latest ON a.skill_item_id = latest.skill_item_id AND a.evaluated_at = latest.max_at
      WHERE a.user_id = ?
    `).all(userId, userId) as Record<string, unknown>[]
    return rows.map(rowToAssessment)
  }

  async getAssessmentSessions(userId: string): Promise<string[]> {
    const rows = this.db.prepare(
      "SELECT DISTINCT evaluated_at FROM assessments WHERE user_id = ? ORDER BY evaluated_at DESC"
    ).all(userId) as { evaluated_at: string }[]
    return rows.map((r) => r.evaluated_at)
  }

  async getAssessmentByUserAndDate(userId: string, evaluatedAt: string): Promise<Assessment[]> {
    const rows = this.db.prepare(
      "SELECT id, user_id, skill_item_id, current_level, evidence, evaluated_at FROM assessments WHERE user_id = ? AND evaluated_at = ?"
    ).all(userId, evaluatedAt) as Record<string, unknown>[]
    return rows.map(rowToAssessment)
  }

  async deleteAssessmentSession(userId: string, evaluatedAt: string): Promise<void> {
    this.db.prepare("DELETE FROM assessments WHERE user_id = ? AND evaluated_at = ?").run(userId, evaluatedAt)
  }

  async updateAssessmentSession(userId: string, evaluatedAt: string, items: AssessmentInput[]): Promise<void> {
    const deleteOld = this.db.prepare("DELETE FROM assessments WHERE user_id = ? AND evaluated_at = ?")
    const insert = this.db.prepare("INSERT INTO assessments (id, user_id, skill_item_id, current_level, evidence, evaluated_at) VALUES (?, ?, ?, ?, ?, ?)")
    const update = this.db.transaction(() => {
      deleteOld.run(userId, evaluatedAt)
      for (const item of items) {
        insert.run(randomUUID(), userId, item.skillItemId, item.currentLevel, item.evidence, evaluatedAt)
      }
    })
    update()
  }

  async getAllLatestAssessments(): Promise<(Assessment & { userName: string; userRole: Role })[]> {
    const rows = this.db.prepare(`
      SELECT a.id, a.user_id, a.skill_item_id, a.current_level, a.evidence, a.evaluated_at,
             u.name as user_name, u.role as user_role
      FROM assessments a
      INNER JOIN (
        SELECT user_id, skill_item_id, MAX(evaluated_at) as max_at
        FROM assessments
        GROUP BY user_id, skill_item_id
      ) latest ON a.user_id = latest.user_id AND a.skill_item_id = latest.skill_item_id AND a.evaluated_at = latest.max_at
      JOIN users u ON a.user_id = u.id
    `).all() as Record<string, unknown>[]
    return rows.map((r) => ({
      ...rowToAssessment(r),
      userName: r.user_name as string,
      userRole: r.user_role as Role,
    }))
  }

  async rebuildAllSummaries(): Promise<{ rebuilt: number }> {
    return { rebuilt: 0 }  // SQLite はサマリー不要
  }
}

function rowToSkillItem(r: Record<string, unknown>): SkillItem {
  return {
    id: r.id as string,
    categoryId: r.category_id as string,
    number: r.number as string,
    label: r.label as string,
    order: r.order as number,
  }
}

function rowToAssessment(r: Record<string, unknown>): Assessment {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    skillItemId: r.skill_item_id as string,
    currentLevel: r.current_level as Level,
    evidence: r.evidence as string,
    evaluatedAt: r.evaluated_at as string,
  }
}
