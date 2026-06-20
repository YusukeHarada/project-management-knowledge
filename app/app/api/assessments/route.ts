import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/db"
import { z } from "zod"

const assessmentItemSchema = z.object({
    skillItemId: z.string(),
    currentLevel: z.number().int().min(0).max(3),
    evidence: z.string().default(""),
})

const saveAssessmentSchema = z.object({
    userId: z.string(),
    items: z.array(assessmentItemSchema).min(1),
})

const updateAssessmentSchema = z.object({
    userId: z.string(),
    date: z.string(),
    items: z.array(assessmentItemSchema).min(1),
})

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = updateAssessmentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }
        const repo = await getRepository()
        await repo.updateAssessmentSession(
            parsed.data.userId,
            parsed.data.date,
            parsed.data.items as Parameters<typeof repo.saveAssessment>[1]
        )
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error("PUT /api/assessments error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = saveAssessmentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }
        const repo = await getRepository()
        await repo.saveAssessment(parsed.data.userId, parsed.data.items as Parameters<typeof repo.saveAssessment>[1])
        return NextResponse.json({ ok: true }, { status: 201 })
    } catch (err) {
        console.error("POST /api/assessments error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")
        const date = searchParams.get("date")
        const sessions = searchParams.get("sessions")
        const all = searchParams.get("all")
        const repo = await getRepository()

        if (userId && sessions === "true") {
            const dates = await repo.getAssessmentSessions(userId)
            return NextResponse.json(dates)
        }
        // all=true: 全履歴を返す（推移グラフ用）
        if (userId && all === "true") {
            const assessments = await repo.getAssessmentByUser(userId)
            return NextResponse.json(assessments)
        }
        if (userId && date) {
            const assessments = await repo.getAssessmentByUserAndDate(userId, date)
            return NextResponse.json(assessments)
        }
        if (userId) {
            const assessments = await repo.getLatestAssessmentByUser(userId)
            return NextResponse.json(assessments)
        }
        const assessments = await repo.getAllLatestAssessments()
        return NextResponse.json(assessments)
    } catch (err) {
        console.error("GET /api/assessments error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")
        const date = searchParams.get("date")
        if (!userId || !date) {
            return NextResponse.json({ error: "userId と date が必要です" }, { status: 400 })
        }
        const repo = await getRepository()
        await repo.deleteAssessmentSession(userId, date)
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error("DELETE /api/assessments error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
