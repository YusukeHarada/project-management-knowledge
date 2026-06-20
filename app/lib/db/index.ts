import type { ISkillRepository } from "./interface"

let _repo: ISkillRepository | null = null

// require() は ES モジュールの named export と相性が悪いため dynamic import() を使う
export async function getRepository(): Promise<ISkillRepository> {
    if (_repo) return _repo

    const backend = process.env.DB_BACKEND ?? "sqlite"
    if (backend === "firestore") {
        const { FirestoreSkillRepository } = await import("./firestore")
        _repo = new FirestoreSkillRepository()
    } else {
        const { SqliteSkillRepository } = await import("./sqlite")
        _repo = new SqliteSkillRepository()
    }
    return _repo
}
