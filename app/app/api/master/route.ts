import { NextResponse } from "next/server"
import { getRepository } from "@/lib/db"

export async function GET() {
    try {
        const repo = await getRepository()
        const [categories, skillItems, roleTargets] = await Promise.all([
            repo.getCategories(),
            repo.getSkillItems(),
            repo.getRoleTargets(),
        ])
        return NextResponse.json({ categories, skillItems, roleTargets })
    } catch (err) {
        console.error("GET /api/master error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
