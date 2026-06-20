import type { Metadata } from "next"
import "./globals.css"
import ClientProviders from "./ClientProviders"

export const metadata: Metadata = {
    title: "スキル診断",
    description: "組み込みSW開発チームのスキル自己評価アプリ",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className="min-h-screen bg-gray-50 text-gray-900">
                <ClientProviders>
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <nav className="max-w-6xl mx-auto flex items-center gap-6">
                            <a href="/" className="font-bold text-lg text-blue-700">スキル診断</a>
                            <a href="/dashboard/team" className="text-sm text-gray-600 hover:text-gray-900">チームダッシュボード</a>
                            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">マスタ管理</a>
                        </nav>
                    </header>
                    <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
                </ClientProviders>
            </body>
        </html>
    )
}
