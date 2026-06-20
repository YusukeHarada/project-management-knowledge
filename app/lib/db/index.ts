import type { ISkillRepository } from "./interface"

let _repo: ISkillRepository | null = null

export function getRepository(): ISkillRepository {
  if (!_repo) {
    // SQLite 実装。将来 Firestore に差し替える場合はここを変更する。
    const { SqliteSkillRepository } = require("./sqlite")
    _repo = new SqliteSkillRepository()
  }
  return _repo!
}
