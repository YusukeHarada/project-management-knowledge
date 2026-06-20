import { FieldValue, Timestamp } from "firebase-admin/firestore"
import type { CollectionReference, DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { randomUUID } from "crypto"
import type { ISkillRepository } from "./interface"
import type { Category, SkillItem, RoleTarget, User, Assessment, AssessmentInput, SkillItemInput, Role, Level } from "@/types"
import { SEED_CATEGORIES, SEED_SKILL_ITEMS, SEED_ROLE_TARGETS } from "@/lib/domain/seed"

function db() {
    return adminDb()
}

function fromSnap<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
    const d = snap.data()
    for (const key of Object.keys(d)) {
        if (d[key] instanceof Timestamp) {
            d[key] = (d[key] as Timestamp).toDate().toISOString()
        }
    }
    return { id: snap.id, ...d } as T
}

export class FirestoreSkillRepository implements ISkillRepository {
    private col(name: string): CollectionReference<DocumentData> {
        return db().collection(name)
    }

    async getCategories(): Promise<Category[]> {
        await this.seedIfEmpty()
        const snap = await this.col("categories").orderBy("order").get()
        return snap.docs.map((d) => fromSnap<Category>(d))
    }

    async getSkillItems(): Promise<SkillItem[]> {
        const cats = await this.getCategories()
        const catOrder = Object.fromEntries(cats.map((c) => [c.id, c.order]))
        const snap = await this.col("skill_items").get()
        return snap.docs
            .map((d) => fromSnap<SkillItem>(d))
            .sort((a, b) => {
                const co = (catOrder[a.categoryId] ?? 0) - (catOrder[b.categoryId] ?? 0)
                return co !== 0 ? co : a.order - b.order
            })
    }

    async getSkillItemsByCategory(categoryId: string): Promise<SkillItem[]> {
        const snap = await this.col("skill_items").where("categoryId", "==", categoryId).orderBy("order").get()
        return snap.docs.map((d) => fromSnap<SkillItem>(d))
    }

    async getRoleTargets(): Promise<RoleTarget[]> {
        const snap = await this.col("role_targets").get()
        return snap.docs.map((d) => fromSnap<RoleTarget>(d))
    }

    async upsertCategory(category: { id?: string; name: string; order: number }): Promise<Category> {
        const id = category.id ?? randomUUID()
        const data: Category = { id, name: category.name, order: category.order }
        await this.col("categories").doc(id).set(data)
        return data
    }

    async deleteCategory(id: string): Promise<void> {
        await this.col("categories").doc(id).delete()
    }

    async upsertSkillItem(item: SkillItemInput): Promise<SkillItem> {
        const id = item.id ?? randomUUID()
        const data: SkillItem = { id, categoryId: item.categoryId, number: item.number, label: item.label, order: item.order }
        await this.col("skill_items").doc(id).set(data)
        return data
    }

    async deleteSkillItem(id: string): Promise<void> {
        await this.col("skill_items").doc(id).delete()
    }

    async upsertRoleTarget(skillItemId: string, role: Role, targetLevel: number): Promise<void> {
        const id = `${skillItemId}_${role}`
        const data: RoleTarget = { skillItemId, role, targetLevel: targetLevel as Level }
        await this.col("role_targets").doc(id).set(data)
    }

    async createUser(name: string, role: Role, id?: string): Promise<User> {
        const userId = id ?? randomUUID()
        const now = new Date().toISOString()
        await this.col("users").doc(userId).set({ id: userId, name, role, createdAt: now })
        return { id: userId, name, role, createdAt: now }
    }

    async getUserById(id: string): Promise<User | null> {
        const snap = await this.col("users").doc(id).get()
        if (!snap.exists) return null
        return fromSnap<User>(snap as QueryDocumentSnapshot<DocumentData>)
    }

    async getAllUsers(): Promise<User[]> {
        const snap = await this.col("users").get()
        return snap.docs.map((d) => fromSnap<User>(d))
    }

    async updateUser(userId: string, data: { name?: string; role?: Role }): Promise<User> {
        const updates: Record<string, unknown> = {}
        if (data.name !== undefined) updates.name = data.name
        if (data.role !== undefined) updates.role = data.role
        await this.col("users").doc(userId).update(updates)
        const snap = await this.col("users").doc(userId).get()
        return fromSnap<User>(snap as QueryDocumentSnapshot<DocumentData>)
    }

    async deleteUser(userId: string): Promise<void> {
        const snap = await this.col("assessments").where("userId", "==", userId).get()
        const batch = db().batch()
        for (const doc of snap.docs) batch.delete(doc.ref)
        batch.delete(this.col("users").doc(userId))
        await batch.commit()
    }

    async saveAssessment(userId: string, items: AssessmentInput[]): Promise<void> {
        const batch = db().batch()
        // ISO 文字列で保存（Timestamp だと文字列クエリと型不一致になるため）
        const now = new Date().toISOString()
        for (const item of items) {
            const id = randomUUID()
            const ref = this.col("assessments").doc(id)
            batch.set(ref, {
                id,
                userId,
                skillItemId: item.skillItemId,
                currentLevel: item.currentLevel,
                evidence: item.evidence,
                evaluatedAt: now,
            })
        }
        await batch.commit()
    }

    async getAssessmentByUser(userId: string): Promise<Assessment[]> {
        const snap = await this.col("assessments").where("userId", "==", userId).get()
        return snap.docs.map((d) => fromSnap<Assessment>(d))
    }

    async getLatestAssessmentByUser(userId: string): Promise<Assessment[]> {
        const all = await this.getAssessmentByUser(userId)
        const latestMap = new Map<string, Assessment>()
        for (const a of all) {
            const existing = latestMap.get(a.skillItemId)
            if (!existing || a.evaluatedAt > existing.evaluatedAt) {
                latestMap.set(a.skillItemId, a)
            }
        }
        return Array.from(latestMap.values())
    }

    async getAssessmentSessions(userId: string): Promise<string[]> {
        const all = await this.getAssessmentByUser(userId)
        return [...new Set(all.map((a) => a.evaluatedAt))].sort((a, b) => b.localeCompare(a))
    }

    async getAssessmentByUserAndDate(userId: string, evaluatedAt: string): Promise<Assessment[]> {
        const snap = await this.col("assessments")
            .where("userId", "==", userId)
            .where("evaluatedAt", "==", evaluatedAt)
            .get()
        return snap.docs.map((d) => fromSnap<Assessment>(d))
    }

    async deleteAssessmentSession(userId: string, evaluatedAt: string): Promise<void> {
        const snap = await this.col("assessments")
            .where("userId", "==", userId)
            .where("evaluatedAt", "==", evaluatedAt)
            .get()
        const batch = db().batch()
        for (const doc of snap.docs) batch.delete(doc.ref)
        await batch.commit()
    }

    async updateAssessmentSession(userId: string, evaluatedAt: string, items: AssessmentInput[]): Promise<void> {
        const oldSnap = await this.col("assessments")
            .where("userId", "==", userId)
            .where("evaluatedAt", "==", evaluatedAt)
            .get()
        const batch = db().batch()
        for (const doc of oldSnap.docs) batch.delete(doc.ref)
        for (const item of items) {
            const id = randomUUID()
            batch.set(this.col("assessments").doc(id), {
                id, userId, skillItemId: item.skillItemId,
                currentLevel: item.currentLevel, evidence: item.evidence, evaluatedAt,
            })
        }
        await batch.commit()
    }

    async getAllLatestAssessments(): Promise<(Assessment & { userName: string; userRole: Role })[]> {
        const [allUsers, assessSnap] = await Promise.all([
            this.getAllUsers(),
            this.col("assessments").get(),
        ])
        const userMap = new Map(allUsers.map((u) => [u.id, u]))
        const allAssessments = assessSnap.docs.map((d) => fromSnap<Assessment>(d))

        const latestMap = new Map<string, Assessment>()
        for (const a of allAssessments) {
            const key = `${a.userId}_${a.skillItemId}`
            const existing = latestMap.get(key)
            if (!existing || a.evaluatedAt > existing.evaluatedAt) {
                latestMap.set(key, a)
            }
        }
        return Array.from(latestMap.values())
            .filter((a) => userMap.has(a.userId))
            .map((a) => {
                const u = userMap.get(a.userId)!
                return { ...a, userName: u.name, userRole: u.role }
            })
    }

    private async seedIfEmpty(): Promise<void> {
        const snap = await this.col("categories").limit(1).get()
        if (!snap.empty) return

        const batch = db().batch()
        for (const c of SEED_CATEGORIES) {
            batch.set(this.col("categories").doc(c.id), c)
        }
        for (const i of SEED_SKILL_ITEMS) {
            batch.set(this.col("skill_items").doc(i.id), i)
        }
        for (const t of SEED_ROLE_TARGETS) {
            const id = `${t.skillItemId}_${t.role}`
            batch.set(this.col("role_targets").doc(id), t)
        }
        await batch.commit()
    }
}
