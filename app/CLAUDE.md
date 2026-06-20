# スキル診断アプリ — CLAUDE.md

## プロジェクト概要

組み込みSW開発チームのスキル自己評価Webアプリ。
チームメンバーが10カテゴリ・53項目のスキルを自己評価し、個人・チーム両方のダッシュボードで結果を確認できる。
スキル項目・目標レベルはアプリ内の管理画面から編集可能。

---

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド
npm run lint     # ESLint
npm test         # ユニットテスト（Vitest）
```

---

## 技術スタック

| 役割 | ライブラリ / サービス |
|---|---|
| フレームワーク | Next.js 16（App Router） |
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| チャート | Recharts（レーダーチャート） |
| DB | better-sqlite3（SQLite） |
| DB抽象層 | Repository パターン（`lib/db/interface.ts`） |
| バリデーション | zod |
| テスト | Vitest |

---

## ディレクトリ構成

```
app/                         # Next.js App Router のルートディレクトリ
├── app/
│   ├── page.tsx             # トップ（名前・ロール入力）
│   ├── assessment/page.tsx  # スキル評価フォーム
│   ├── dashboard/
│   │   ├── [userId]/page.tsx  # 個人ダッシュボード（レーダーチャート）
│   │   └── team/page.tsx      # チームダッシュボード（ヒートマップ）
│   ├── admin/page.tsx       # マスタ管理（カテゴリ・スキル項目・目標Lv）
│   └── api/
│       ├── users/route.ts
│       ├── assessments/route.ts
│       ├── master/route.ts
│       ├── master/categories/route.ts
│       └── master/items/route.ts
├── lib/
│   ├── db/
│   │   ├── interface.ts     # ISkillRepository インターフェース定義
│   │   ├── sqlite.ts        # SQLite 実装
│   │   └── index.ts         # factory（環境に応じた実装を返す）
│   └── domain/
│       ├── scoring.ts       # ギャップ計算・優先度算出ロジック（純粋関数）
│       ├── scoring.test.ts  # ユニットテスト
│       └── seed.ts          # スキルマップ.md の初期データ定義
├── types/index.ts           # 型定義（User, SkillItem, Assessment 等）
└── data/skill.db            # SQLite DB ファイル（.gitignore 推奨）
```

---

## データモデル（SQLite）

```sql
categories(id, name, order)
skill_items(id, category_id, number, label, order)
role_targets(skill_item_id, role, target_level)   -- role: developer/pl/promoter
users(id, name, role, created_at)
assessments(id, user_id, skill_item_id, current_level, evidence, evaluated_at)
```

---

## 画面構成

| パス | 画面名 | 概要 |
|---|---|---|
| `/` | トップ | 名前・ロール入力 → 診断開始 |
| `/assessment?userId=xxx` | スキル評価 | カテゴリ別に53項目をLv0〜3で評価・根拠テキスト入力 |
| `/dashboard/[userId]` | 個人ダッシュボード | レーダーチャート・ギャップ一覧・育成アクション |
| `/dashboard/team` | チームダッシュボード | カテゴリ別平均・弱点サマリ・項目×メンバーのヒートマップ |
| `/admin` | マスタ管理 | カテゴリ・スキル項目の追加/編集/削除、ロール別目標Lv設定 |

---

## アーキテクチャ上の決定事項

### 認証なし（名前入力のみ）
小規模チームでの導入コストを下げるため。将来的に Firebase Auth を追加する場合は `lib/db/interface.ts` の `getUserById` 周辺を修正する。

### Repository パターン（DB抽象層）
`lib/db/interface.ts` に `ISkillRepository` を定義し、現在は SQLite 実装を使用。
Firestore に移行する場合は `lib/db/firestore.ts` を作成し、`lib/db/index.ts` の factory を切り替えるだけでよい。

### SQLite の初期化
`lib/db/sqlite.ts` の `getDb()` が初回呼び出し時にスキーマ作成とシード投入を行う。
DB は `data/skill.db` に保存される。バージョン管理には含めないこと。

### スキルマップのマスタデータ
`lib/domain/seed.ts` にスキルマップ.md の全データをコードとして持つ。
DB が空の場合のみシード投入される。アプリ内の管理画面で変更した内容はDBに保存され、seed.ts は上書きしない。

---

## ビジネスロジック

- `lib/domain/scoring.ts` — ギャップ計算・優先度算出・育成アクション提案（純粋関数）
  - `calcGap(currentLevel, targetLevel)` → ギャップ数値
  - `calcPriority(currentLevel, targetLevel)` → high/medium/low
  - `suggestAction(currentLevel, targetLevel)` → 育成アクション文言
  - `buildGapAnalysis(...)` → 全項目のギャップ分析
  - `aggregateCategoryScores(...)` → カテゴリ別平均スコア

---

## Firestore 移行時の手順（将来対応）

1. `lib/db/firestore.ts` を作成し `ISkillRepository` を実装
2. `lib/db/index.ts` の factory で環境変数によって切り替え
3. `types/index.ts` の型定義はそのまま使える

---

## スコープ管理

### 実装済み
- [x] 名前・ロール入力（認証なし）
- [x] スキル評価フォーム（10カテゴリ・44項目、Lv0〜3 + 根拠テキスト）
- [x] 個人ダッシュボード（レーダーチャート・ギャップ一覧・育成アクション）
- [x] チームダッシュボード（カテゴリ別平均・弱点サマリ・ヒートマップ）
- [x] マスタ管理画面（カテゴリ・スキル項目・ロール別目標Lv）
- [x] SQLite 永続化 + Repository パターン
- [x] ビジネスロジックのユニットテスト

### 未実装（将来対応）
- Firebase Auth による認証（導入時はCLAUDE.mdの認証セクションを更新）
- Firestore への移行（lib/db/interface.ts の差し替えで対応可能）
- 上長評価機能（自己評価と上長評価の乖離分析）
- CSV/Excel エクスポート
- スキルマップのバージョン管理（変更履歴）
