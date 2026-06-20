import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/db"
import { z } from "zod"

const createUserSchema = z.object({
    name: z.string().min(1).max(50),
    role: z.enum(["developer", "pl", "pm", "promoter"]),
    uid: z.string().optional(),    // Firestore モード: Google UID を指定
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = createUserSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }
        const repo = await getRepository()
        const user = await repo.createUser(parsed.data.name, parsed.data.role, parsed.data.uid)
        return NextResponse.json(user, { status: 201 })
    } catch (err) {
        console.error("POST /api/users error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const uid = searchParams.get("uid")
        const repo = await getRepository()

        if (uid) {
            const user = await repo.getUserById(uid)
            return NextResponse.json(user)
        }

        const users = await repo.getAllUsers()
        return NextResponse.json(users)
    } catch (err) {
        console.error("GET /api/users error:", err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
