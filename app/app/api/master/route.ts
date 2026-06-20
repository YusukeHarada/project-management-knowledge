import { NextResponse } from "next/server"
import { getRepository } from "@/lib/db"

export async function GET() {
  const repo = getRepository()
  const [categories, skillItems, roleTargets] = await Promise.all([
    repo.getCategories(),
    repo.getSkillItems(),
    repo.getRoleTargets(),
  ])
  return NextResponse.json({ categories, skillItems, roleTargets })
}
