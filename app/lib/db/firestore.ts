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

// シード済みキャッシュ（プロセス内で1回だけ Firestore を確認）
let _seeded = false

// サマリードキュメントの型（summaries/{userId}）
interface UserSummary {
    userId: string
    userName: string
    userRole: Role
    sessions: string[]   // 全セッション日時、新しい順
    latest: Record<string, { currentLevel: Level; evidence: string; evaluatedAt: string }>
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

    // ---- マスタ ----

    async getCategories(): Promise<Category[]> {
        await this.seedIfEmpty()
        const snap = await this.col("categories").orderBy("order").get()
        return snap.docs.map((d) => fromSnap<Category>(d))
    }

    async getSkillItems(): Promise<SkillItem[]> {
        const [catSnap, itemSnap] = await Promise.all([
            this.col("categories").get(),
            this.col("skill_items").get(),
        ])
        const catOrder = Object.fromEntries(catSnap.docs.map((d) => [d.id, (d.data().order as number) ?? 0]))
        return itemSnap.docs
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

    // ---- ユーザー ----

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
        const user = fromSnap<User>(snap as QueryDocumentSnapshot<DocumentData>)
        // サマリーの名前・ロールも更新
        const summarySnap = await this.col("summaries").doc(userId).get()
        if (summarySnap.exists) {
            await this.col("summaries").doc(userId).update({
                ...(data.name !== undefined ? { userName: data.name } : {}),
                ...(data.role !== undefined ? { userRole: data.role } : {}),
            })
        }
        return user
    }

    async deleteUser(userId: string): Promise<void> {
        const [assessSnap] = await Promise.all([
            this.col("assessments").where("userId", "==", userId).get(),
        ])
        const batch = db().batch()
        for (const doc of assessSnap.docs) batch.delete(doc.ref)
        batch.delete(this.col("users").doc(userId))
        batch.delete(this.col("summaries").doc(userId))
        await batch.commit()
    }

    // ---- 評価（サマリー活用） ----

    async saveAssessment(userId: string, items: AssessmentInput[]): Promise<void> {
        const now = new Date().toISOString()

        // ユーザー情報を取得（サマリーに名前・ロールを含めるため）
        const userSnap = await this.col("users").doc(userId).get()
        const userData = userSnap.data() as { name: string; role: Role } | undefined

        const batch = db().batch()

        // 評価ドキュメントを保存
        for (const item of items) {
            const id = randomUUID()
            batch.set(this.col("assessments").doc(id), {
                id, userId,
                skillItemId: item.skillItemId,
                currentLevel: item.currentLevel,
                evidence: item.evidence,
                evaluatedAt: now,
            })
        }

        // サマリーを更新（新しいセッションは常に最新なので latest を上書き）
        const latest: Record<string, { currentLevel: Level; evidence: string; evaluatedAt: string }> = {}
        for (const item of items) {
            latest[item.skillItemId] = {
                currentLevel: item.currentLevel,
                evidence: item.evidence,
                evaluatedAt: now,
            }
        }
        batch.set(this.col("summaries").doc(userId), {
            userId,
            userName: userData?.name ?? userId,
            userRole: userData?.role ?? "developer",
            sessions: FieldValue.arrayUnion(now),
            latest,
        }, { merge: true })

        await batch.commit()
    }

    async getAssessmentByUser(userId: string): Promise<Assessment[]> {
        const snap = await this.col("assessments").where("userId", "==", userId).get()
        return snap.docs.map((d) => fromSnap<Assessment>(d))
    }

    // サマリーから高速取得（1 read）。サマリーがなければ旧方式でフォールバック
    async getLatestAssessmentByUser(userId: string): Promise<Assessment[]> {
        const summarySnap = await this.col("summaries").doc(userId).get()
        if (summarySnap.exists) {
            const summary = summarySnap.data() as UserSummary
            return Object.entries(summary.latest ?? {}).map(([skillItemId, item]) => ({
                id: `${userId}_${skillItemId}`,
                userId,
                skillItemId,
                currentLevel: item.currentLevel,
                evidence: item.evidence,
                evaluatedAt: item.evaluatedAt,
            }))
        }
        // フォールバック: 旧方式（サマリー未作成ユーザー用）
        return this._getLatestFromRaw(userId)
    }

    private async _getLatestFromRaw(userId: string): Promise<Assessment[]> {
        const all = await this.getAssessmentByUser(userId)
        const latestMap = new Map<string, Assessment>()
        for (const a of all) {
            const existing = latestMap.get(a.skillItemId)
            if (!existing || a.evaluatedAt > existing.evaluatedAt) latestMap.set(a.skillItemId, a)
        }
        return Array.from(latestMap.values())
    }

    // サマリーから高速取得（1 read）。サマリーがなければ旧方式でフォールバック
    async getAssessmentSessions(userId: string): Promise<string[]> {
        const summarySnap = await this.col("summaries").doc(userId).get()
        if (summarySnap.exists) {
            const summary = summarySnap.data() as UserSummary
            return (summary.sessions ?? []).sort((a, b) => b.localeCompare(a))
        }
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
        // 編集後にサマリーを再構築（過去セッション編集が latest に影響する場合があるため）
        await this.rebuildSummary(userId)
    }

    async deleteAssessmentSession(userId: string, evaluatedAt: string): Promise<void> {
        const snap = await this.col("assessments")
            .where("userId", "==", userId)
            .where("evaluatedAt", "==", evaluatedAt)
            .get()
        const batch = db().batch()
        for (const doc of snap.docs) batch.delete(doc.ref)
        await batch.commit()
        // 削除後にサマリーを再構築
        await this.rebuildSummary(userId)
    }

    // チームダッシュボード用: summaries を読む（N reads、N = ユーザー数）
    async getAllLatestAssessments(): Promise<(Assessment & { userName: string; userRole: Role })[]> {
        const snap = await this.col("summaries").get()
        const result: (Assessment & { userName: string; userRole: Role })[] = []

        for (const doc of snap.docs) {
            const summary = doc.data() as UserSummary
            for (const [skillItemId, item] of Object.entries(summary.latest ?? {})) {
                result.push({
                    id: `${summary.userId}_${skillItemId}`,
                    userId: summary.userId,
                    skillItemId,
                    currentLevel: item.currentLevel,
                    evidence: item.evidence,
                    evaluatedAt: item.evaluatedAt,
                    userName: summary.userName,
                    userRole: summary.userRole,
                })
            }
        }
        return result
    }

    // サマリー全再構築（管理画面から実行、既存ユーザーの移行用）
    async rebuildAllSummaries(): Promise<{ rebuilt: number }> {
        const usersSnap = await this.col("users").get()
        let rebuilt = 0
        for (const doc of usersSnap.docs) {
            await this.rebuildSummary(doc.id)
            rebuilt++
        }
        return { rebuilt }
    }

    // 特定ユーザーのサマリーを再構築
    private async rebuildSummary(userId: string): Promise<void> {
        const userSnap = await this.col("users").doc(userId).get()
        if (!userSnap.exists) {
            await this.col("summaries").doc(userId).delete()
            return
        }
        const user = fromSnap<User>(userSnap as QueryDocumentSnapshot<DocumentData>)

        const assessSnap = await this.col("assessments").where("userId", "==", userId).get()
        const all = assessSnap.docs.map((d) => fromSnap<Assessment>(d))

        if (all.length === 0) {
            await this.col("summaries").doc(userId).delete()
            return
        }

        const sessions = [...new Set(all.map((a) => a.evaluatedAt))].sort((a, b) => b.localeCompare(a))

        const latestMap = new Map<string, Assessment>()
        for (const a of all) {
            const existing = latestMap.get(a.skillItemId)
            if (!existing || a.evaluatedAt > existing.evaluatedAt) latestMap.set(a.skillItemId, a)
        }

        const latest: Record<string, { currentLevel: Level; evidence: string; evaluatedAt: string }> = {}
        for (const [skillItemId, a] of latestMap) {
            latest[skillItemId] = { currentLevel: a.currentLevel, evidence: a.evidence, evaluatedAt: a.evaluatedAt }
        }

        await this.col("summaries").doc(userId).set({
            userId,
            userName: user.name,
            userRole: user.role,
            sessions,
            latest,
        })
    }

    private async seedIfEmpty(): Promise<void> {
        if (_seeded) return
        const snap = await this.col("categories").limit(1).get()
        if (!snap.empty) { _seeded = true; return }

        const batch = db().batch()
        for (const c of SEED_CATEGORIES) batch.set(this.col("categories").doc(c.id), c)
        for (const i of SEED_SKILL_ITEMS) batch.set(this.col("skill_items").doc(i.id), i)
        for (const t of SEED_ROLE_TARGETS) {
            batch.set(this.col("role_targets").doc(`${t.skillItemId}_${t.role}`), t)
        }
        await batch.commit()
        _seeded = true
    }
}
