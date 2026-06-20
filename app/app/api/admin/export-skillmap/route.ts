import { NextResponse } from "next/server"
import { getRepository } from "@/lib/db"
import type { Category, SkillItem, RoleTarget, Role } from "@/types"

const ROLE_LABELS: Record<Role, string> = { developer: "開発者", pl: "PL", pm: "PM", promoter: "推進者" }
const ROLE_ORDER: Role[] = ["developer", "pl", "pm", "promoter"]

const LEVEL_DEFINITION = `## 1. 習熟度レベルの定義

| レベル | 名称 | 定義 |
|-------|------|------|
| **0** | 未経験 | 知らない・やったことがない |
| **1** | 見習い | 手順書・テンプレートがあれば一人でできる |
| **2** | 自立 | 手順書なしで一人でできる。標準的なケースに対応できる |
| **3** | 熟練 | 例外ケースにも対応できる。他者に教えられる・改善提案できる |

`

function buildMarkdown(categories: Category[], skillItems: SkillItem[], roleTargets: RoleTarget[]): string {
    const lines: string[] = []
    lines.push("# スキルマップ\n")
    lines.push("組み込みソフトウェア開発チームにおける役割別のスキル定義と習熟度目標。\n")
    lines.push("---\n")
    lines.push(LEVEL_DEFINITION)
    lines.push("---\n")
    lines.push("## 2. スキルカテゴリと評価項目\n")

    // ロール列見出し（DB に存在するロールのみ）
    const existingRoles = ROLE_ORDER.filter((r) =>
        roleTargets.some((t) => t.role === r)
    )
    const roleHeader = existingRoles.map((r) => `${ROLE_LABELS[r]}目標`).join(" | ")
    const roleSep = existingRoles.map(() => "---").join(" | ")

    for (const cat of categories) {
        lines.push(`### カテゴリ${cat.order}：${cat.name}\n`)
        lines.push(`| # | 評価項目 | ${roleHeader} |`)
        lines.push(`|---|---------|${roleSep}|`)

        const items = skillItems.filter((i) => i.categoryId === cat.id)
        for (const item of items) {
            const targets = existingRoles.map((r) => {
                const t = roleTargets.find((rt) => rt.skillItemId === item.id && rt.role === r)
                return t !== undefined ? `Lv${t.targetLevel}` : "—"
            }).join(" | ")
            lines.push(`| ${item.number} | ${item.label} | ${targets} |`)
        }
        lines.push("")
    }

    lines.push("---\n")
    lines.push(`*このファイルはスキル診断アプリの管理画面から自動生成されました。*\n`)

    return lines.join("\n")
}

export async function POST() {
    try {
        const repo = await getRepository()
        const [categories, skillItems, roleTargets] = await Promise.all([
            repo.getCategories(),
            repo.getSkillItems(),
            repo.getRoleTargets(),
        ])

        const markdown = buildMarkdown(categories, skillItems, roleTargets)

        return new NextResponse(markdown, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": "attachment; filename*=UTF-8''%E3%82%B9%E3%82%AD%E3%83%AB%E3%83%9E%E3%83%83%E3%83%97.md",
            },
        })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
