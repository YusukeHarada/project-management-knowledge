"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Category, SkillItem, RoleTarget, Role, Level, User } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { isAdmin } from "@/lib/utils/admin"

const ROLES: Role[] = ["developer", "pl", "pm", "promoter"]
const ROLE_LABELS: Record<Role, string> = { developer: "開発者", pl: "PL", pm: "PM", promoter: "推進者" }

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [skillItems, setSkillItems] = useState<SkillItem[]>([])
  const [roleTargets, setRoleTargets] = useState<RoleTarget[]>([])
  const [loading, setLoading] = useState(true)

  // フォーム状態
  const [newCatName, setNewCatName] = useState("")
  const [editingItem, setEditingItem] = useState<Partial<SkillItem & { targets: Record<Role, Level> }> | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"categories" | "items" | "users">("categories")
  const [users, setUsers] = useState<User[]>([])

  async function load() {
    const [master, userList] = await Promise.all([
      fetch("/api/master").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ])
    setCategories(master.categories)
    setSkillItems(master.skillItems)
    setRoleTargets(master.roleTargets)
    setUsers(Array.isArray(userList) ? userList : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteUser(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？\n診断データもすべて削除されます。この操作は元に戻せません。`)) return
    await fetch(`/api/users?id=${id}`, { method: "DELETE" })
    await load()
  }

  function getTarget(skillItemId: string, role: Role): Level {
    return (roleTargets.find((t) => t.skillItemId === skillItemId && t.role === role)?.targetLevel ?? 0) as Level
  }

  async function addCategory() {
    if (!newCatName.trim()) return
    setSaving(true)
    await fetch("/api/master/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), order: categories.length + 1 }),
    })
    setNewCatName("")
    await load()
    setSaving(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm("このカテゴリを削除しますか？（関連スキル項目も削除されます）")) return
    await fetch(`/api/master/categories?id=${id}`, { method: "DELETE" })
    await load()
  }

  async function saveItem() {
    if (!editingItem?.categoryId || !editingItem?.label || !editingItem?.number) return
    setSaving(true)
    await fetch("/api/master/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingItem.id,
        categoryId: editingItem.categoryId,
        number: editingItem.number,
        label: editingItem.label,
        order: editingItem.order ?? 99,
        targets: ROLES.map((role) => ({ role, targetLevel: editingItem.targets?.[role] ?? 0 })),
      }),
    })
    setEditingItem(null)
    await load()
    setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm("このスキル項目を削除しますか？")) return
    await fetch(`/api/master/items?id=${id}`, { method: "DELETE" })
    await load()
  }

  function startEditItem(item: SkillItem) {
    const targets = Object.fromEntries(ROLES.map((r) => [r, getTarget(item.id, r)])) as Record<Role, Level>
    setEditingItem({ ...item, targets })
  }

  function startNewItem() {
    const targets = Object.fromEntries(ROLES.map((r) => [r, 0])) as Record<Role, Level>
    setEditingItem({ categoryId: categories[0]?.id ?? "", number: "", label: "", order: 99, targets })
  }

  async function exportSkillMap() {
    const res = await fetch("/api/admin/export-skillmap", { method: "POST" })
    if (res.ok) {
      alert("スキルマップ.md を更新しました。")
    } else {
      const data = await res.json()
      alert(`エラー: ${data.error}`)
    }
  }

  // 管理者チェック（Firestore モードのみ。認証解決後に判定）
  if (!authLoading && !isAdmin(user?.email)) {
    router.replace("/")
    return null
  }

  if (loading) return <div className="text-center py-20 text-gray-500">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マスタ管理</h1>
        <button
          onClick={exportSkillMap}
          className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          スキルマップ.md を更新する
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {([["categories", "カテゴリ管理"], ["items", "スキル項目管理"], ["users", "ユーザー管理（管理者）"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "categories" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">カテゴリ一覧</h2>
          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400 w-6">{cat.order}</span>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-gray-400">{skillItems.filter((i) => i.categoryId === cat.id).length}項目</span>
                <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700">削除</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="新しいカテゴリ名"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCategory}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={startNewItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              新しい項目を追加
            </button>
          </div>

          {editingItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold mb-4">{editingItem.id ? "項目を編集" : "新しい項目を追加"}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">カテゴリ</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem((p) => ({ ...p!, categoryId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">番号</label>
                    <input
                      type="text"
                      value={editingItem.number ?? ""}
                      onChange={(e) => setEditingItem((p) => ({ ...p!, number: e.target.value }))}
                      placeholder="例: 1-1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">順序</label>
                    <input
                      type="number"
                      value={editingItem.order ?? 99}
                      onChange={(e) => setEditingItem((p) => ({ ...p!, order: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">評価項目ラベル</label>
                  <textarea
                    value={editingItem.label ?? ""}
                    onChange={(e) => setEditingItem((p) => ({ ...p!, label: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">ロール別目標レベル</label>
                  <div className="flex gap-4">
                    {ROLES.map((role) => (
                      <div key={role} className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">{ROLE_LABELS[role]}</label>
                        <select
                          value={editingItem.targets?.[role] ?? 0}
                          onChange={(e) => setEditingItem((p) => ({ ...p!, targets: { ...p!.targets!, [role]: Number(e.target.value) as Level } }))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {[0, 1, 2, 3].map((lv) => <option key={lv} value={lv}>Lv{lv}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveItem} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button onClick={() => setEditingItem(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {categories.map((cat) => {
            const items = skillItems.filter((i) => i.categoryId === cat.id)
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">{cat.name}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs font-mono text-gray-400 w-8 mt-0.5 shrink-0">{item.number}</span>
                      <span className="flex-1 text-sm text-gray-800 leading-snug">{item.label}</span>
                      <div className="flex gap-2 shrink-0">
                        {ROLES.map((r) => (
                          <span key={r} className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                            {ROLE_LABELS[r].substring(0, 2)}:Lv{getTarget(item.id, r)}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEditItem(item)} className="text-xs text-blue-600 hover:text-blue-800">編集</button>
                        <button onClick={() => deleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700">削除</button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-gray-400 py-2">このカテゴリにはまだ項目がありません</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">ユーザー一覧</h2>
            <p className="text-xs text-gray-500 mt-1">削除するとそのユーザーの診断データもすべて削除されます。</p>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">登録されているユーザーがいません。</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-left py-2 pr-4">名前</th>
                  <th className="text-left py-2 pr-4">ロール</th>
                  <th className="text-left py-2 pr-4">登録日</th>
                  <th className="text-right py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{u.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{ROLE_LABELS[u.role]}</td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("ja-JP")}</td>
                    <td className="py-2 text-right">
                      <a href={`/dashboard/${u.id}`} className="text-xs text-blue-600 hover:underline mr-3">ダッシュボード</a>
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
