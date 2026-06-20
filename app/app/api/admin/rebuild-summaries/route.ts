import { NextResponse } from "next/server"
import { getRepository } from "@/lib/db"

export async function POST() {
    try {
        const repo = await getRepository()
        if (!repo.rebuildAllSummaries) {
            return NextResponse.json({ message: "SQLite モードではサマリー不要です" })
        }
        const result = await repo.rebuildAllSummaries()
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error("rebuild-summaries error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
