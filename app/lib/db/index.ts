import type { ISkillRepository } from "./interface"

let _repo: ISkillRepository | null = null

export function getRepository(): ISkillRepository {
    if (!_repo) {
        const backend = process.env.DB_BACKEND ?? "sqlite"
        if (backend === "firestore") {
            const { FirestoreSkillRepository } = require("./firestore")
            _repo = new FirestoreSkillRepository()
        } else {
            const { SqliteSkillRepository } = require("./sqlite")
            _repo = new SqliteSkillRepository()
        }
    }
    return _repo!
}
