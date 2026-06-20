// 管理者かどうかを判定する
// SQLite モード（ローカル開発）は常に管理者扱い
// Firestore モードは NEXT_PUBLIC_ADMIN_EMAILS に含まれるメールアドレスのみ
// NEXT_PUBLIC_ADMIN_EMAILS が未設定の場合はログイン済みユーザー全員を管理者扱い（初期状態）
export function isAdmin(email: string | null | undefined): boolean {
    if (process.env.NEXT_PUBLIC_DB_BACKEND !== "firestore") return true
    if (!email) return false

    const adminEmailsStr = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").trim()

    // 未設定の場合はログイン済みユーザー全員に管理者権限を付与
    // → 運用開始後は NEXT_PUBLIC_ADMIN_EMAILS を必ず設定すること
    if (!adminEmailsStr) return true

    const adminEmails = adminEmailsStr
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    return adminEmails.includes(email.toLowerCase())
}
