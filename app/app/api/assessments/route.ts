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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = saveAssessmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const repo = getRepository()
  await repo.saveAssessment(parsed.data.userId, parsed.data.items as Parameters<typeof repo.saveAssessment>[1])
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const repo = getRepository()

  if (userId) {
    const assessments = await repo.getLatestAssessmentByUser(userId)
    return NextResponse.json(assessments)
  }

  const assessments = await repo.getAllLatestAssessments()
  return NextResponse.json(assessments)
}
