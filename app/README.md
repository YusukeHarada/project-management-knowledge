# スキル診断アプリ

組み込みSW開発チームのスキル自己評価 Web アプリ。スキルマップ（10カテゴリ・53項目）を Web 上で入力・集計し、個人とチームのダッシュボードで結果を確認できる。

## 起動方法

```bash
npm install    # 初回のみ
npm run dev    # http://localhost:3000
```

## コマンド一覧

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run lint     # ESLint
npm test         # ユニットテスト（Vitest）
```

## 画面構成

| 画面 | URL | 内容 |
|------|-----|------|
| トップ | `/` | 名前・ロール入力で診断開始 |
| スキル評価 | `/assessment` | 10カテゴリ・53項目を Lv0〜3 で評価 |
| 個人ダッシュボード | `/dashboard/[userId]` | レーダーチャート・ギャップ一覧・育成アクション |
| チームダッシュボード | `/dashboard/team` | カテゴリ別平均・弱点サマリ・ヒートマップ |
| マスタ管理 | `/admin` | カテゴリ・スキル項目・ロール別目標 Lv の編集 |

## 技術スタック

| 役割 | 採用技術 |
|------|---------|
| フレームワーク | Next.js 16（App Router） |
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| チャート | Recharts |
| DB | better-sqlite3（SQLite） |
| DB抽象層 | Repository パターン（`lib/db/interface.ts`） |
| バリデーション | zod |
| テスト | Vitest |

設計の詳細・アーキテクチャ決定事項は [CLAUDE.md](CLAUDE.md) を参照。
