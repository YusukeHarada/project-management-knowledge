import type { Metadata } from "next"
import "./globals.css"
import ClientProviders from "./ClientProviders"
import ClientHeader from "./ClientHeader"

export const metadata: Metadata = {
    title: "スキル診断",
    description: "組み込みSW開発チームのスキル自己評価アプリ",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className="min-h-screen bg-gray-50 text-gray-900">
                <ClientProviders>
                    <ClientHeader />
                    <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
                </ClientProviders>
            </body>
        </html>
    )
}
