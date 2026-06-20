import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/db"
import { z } from "zod"

const itemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  number: z.string().min(1),
  label: z.string().min(1).max(300),
  order: z.number().int().min(0),
  targets: z.array(z.object({
    role: z.enum(["developer", "pl", "promoter"]),
    targetLevel: z.number().int().min(0).max(3),
  })).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const repo = getRepository()
  const item = await repo.upsertSkillItem(parsed.data)
  if (parsed.data.targets) {
    for (const t of parsed.data.targets) {
      await repo.upsertRoleTarget(item.id, t.role, t.targetLevel)
    }
  }
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const repo = getRepository()
  await repo.deleteSkillItem(id)
  return NextResponse.json({ ok: true })
}
