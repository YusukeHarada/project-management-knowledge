// 管理者かどうかを判定する
// SQLite モード（ローカル開発）は常に管理者扱い
// Firestore モードは NEXT_PUBLIC_ADMIN_EMAILS に含まれるメールアドレスのみ
export function isAdmin(email: string | null | undefined): boolean {
    if (process.env.NEXT_PUBLIC_DB_BACKEND !== "firestore") return true
    if (!email) return false
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    return adminEmails.includes(email.toLowerCase())
}
