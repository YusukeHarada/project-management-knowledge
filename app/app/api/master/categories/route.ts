import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/db"
import { z } from "zod"

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const repo = getRepository()
  const category = await repo.upsertCategory(parsed.data)
  return NextResponse.json(category, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const repo = getRepository()
  await repo.deleteCategory(id)
  return NextResponse.json({ ok: true })
}
