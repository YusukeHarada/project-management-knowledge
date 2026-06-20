# スキル診断アプリ — CLAUDE.md

@import ~/develop/claude-settings/docs/firebase-notes.md
@import ~/develop/claude-settings/docs/nextjs-notes.md
@import ~/develop/claude-settings/docs/github-notes.md

## プロジェクト概要

組み込みSW開発チームのスキル自己評価Webアプリ。
チームメンバーが10カテゴリ・53項目のスキルを自己評価し、個人・チーム両方のダッシュボードで結果を確認できる。
スキル項目・目標レベルはアプリ内の管理画面から編集可能。管理画面の「スキルマップ.md を更新する」で `../スキルマップ.md` に書き出せる。

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
| DB（SQLite モード） | better-sqlite3 |
| DB（Firestore モード） | Firebase Admin SDK + Firestore |
| 認証（Firestore モード） | Firebase Authentication（Google） |
| DB抽象層 | Repository パターン（`lib/db/interface.ts`） |
| バリデーション | zod |
| テスト | Vitest |

---

## 環境変数（`.env.local`）

### SQLite モード（デフォルト）
```bash
DB_BACKEND=sqlite
NEXT_PUBLIC_DB_BACKEND=sqlite
```

### Firestore モード
```bash
DB_BACKEND=firestore
NEXT_PUBLIC_DB_BACKEND=firestore
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=   # JSON を文字列化したもの
NEXT_PUBLIC_ADMIN_EMAILS=       # カンマ区切りで管理者メールアドレスを指定（未設定時は全員管理者）
```

`DB_BACKEND` は API ルート（サーバーサイド）、`NEXT_PUBLIC_DB_BACKEND` はクライアントサイドの認証ガードに使用する。両方を同じ値に設定すること。

---

## ディレクトリ構成

```
app/
├── app/
│   ├── page.tsx                      # トップ（新規 / 続きから の 2 タブ）
│   ├── assessment/page.tsx           # スキル評価フォーム（前回値 pre-fill）
│   ├── dashboard/
│   │   ├── [userId]/page.tsx         # 個人ダッシュボード（レーダーチャート・履歴比較）
│   │   └── team/page.tsx             # チームダッシュボード（レーダーチャート・ヒートマップ）
│   ├── admin/page.tsx                # マスタ管理（スキルマップ.md エクスポート・ユーザー管理・サマリー再構築）
│   ├── settings/page.tsx             # ユーザー設定（表示名・ロール変更・アカウント削除）
│   ├── (auth)/login/page.tsx         # Google ログイン画面（Firestore モードのみ使用）
│   └── api/
│       ├── users/route.ts
│       ├── assessments/route.ts
│       ├── master/route.ts
│       ├── master/categories/route.ts
│       ├── master/items/route.ts
│       ├── admin/export-skillmap/route.ts   # スキルマップ.md 生成・書き出し
│       └── admin/rebuild-summaries/route.ts # Firestore summaries 再構築
├── contexts/
│   └── AuthContext.tsx               # Firebase Auth 状態管理（Firestore モード用）
├── lib/
│   ├── db/
│   │   ├── interface.ts              # ISkillRepository インターフェース定義
│   │   ├── sqlite.ts                 # SQLite 実装
│   │   ├── firestore.ts              # Firestore 実装
│   │   └── index.ts                  # DB_BACKEND で実装を切り替える factory
│   ├── firebase/
│   │   ├── client.ts                 # Firebase Client SDK 初期化
│   │   └── admin.ts                  # Firebase Admin SDK 初期化（API ルート専用）
│   └── domain/
│       ├── scoring.ts                # ギャップ計算・優先度算出ロジック（純粋関数）
│       ├── scoring.test.ts           # ユニットテスト
│       └── seed.ts                   # スキルマップ初期データ（全ロール含む）
├── types/index.ts                    # 型定義（Role: developer/pl/pm/promoter）
└── data/skill.db                     # SQLite DB ファイル（.gitignore 済み）
```

---

## データモデル（SQLite）

```sql
categories(id, name, order)
skill_items(id, category_id, number, label, order)
role_targets(skill_item_id, role, target_level)   -- role: developer/pl/pm/promoter
users(id, name, role, created_at)
assessments(id, user_id, skill_item_id, current_level, evidence, evaluated_at)
```

## データモデル（Firestore）

```
categories/{id}      : { name, order }
skill_items/{id}     : { categoryId, number, label, order }
role_targets/{itemId}_{role} : { skillItemId, role, targetLevel }
users/{uid}          : { name, role, createdAt }
assessments/{id}     : { userId, skillItemId, currentLevel, evidence, evaluatedAt }
summaries/{uid}      : { userId, userName, userRole, sessions[], latest: Record<skillItemId, {currentLevel, evidence, evaluatedAt}> }
```

`summaries` は読み取り最適化用の非正規化コレクション。`assessments` への書き込み時に同時更新される。
チームダッシュボードの全ユーザー最新評価取得を N×53 reads → N reads（N=ユーザー数）に削減する。

---

## 画面構成

| パス | 画面名 | 概要 |
|---|---|---|
| `/` | トップ | 新規登録 / 続きから診断する（2タブ） |
| `/assessment?userId=xxx` | スキル評価 | 53項目をLv0〜3で評価・前回値 pre-fill・カテゴリ遷移ボタン |
| `/dashboard/[userId]` | 個人ダッシュボード | レーダーチャート・ギャップ一覧・育成アクション・履歴比較・セッション編集/削除 |
| `/dashboard/team` | チームダッシュボード | レーダーチャート・カテゴリ別平均・弱点サマリ・ヒートマップ |
| `/admin` | マスタ管理 | カテゴリ・スキル項目・ロール別目標Lv・スキルマップ.md 出力・ユーザー管理・サマリー再構築 |
| `/settings` | ユーザー設定 | 表示名・ロール変更・アカウント削除（Firestore モード） |
| `/login` | ログイン | Google サインイン（Firestore モード時のみ使用） |

---

## アーキテクチャ上の決定事項

### DB 切り替え（DB_BACKEND）
`lib/db/index.ts` の factory が `DB_BACKEND` 環境変数を読んで実装を選択する。
- `sqlite`（デフォルト）: ローカル開発・小規模チーム向け。認証なし、名前入力のみ。
- `firestore`: Firebase Auth (Google) による認証 + Firestore 永続化。

### Firebase Client SDK と SSR
Firebase Client SDK はブラウザ API に依存するため、`app/layout.tsx` で `dynamic(() => import(...), { ssr: false })` を使用して SSR を回避している（firebase-notes.md）。

### スキルマップ.md の管理
管理画面が唯一の変更先。変更後は「スキルマップ.md を更新する」ボタンで `../スキルマップ.md` を再生成する。
`lib/domain/seed.ts` は DB が空のときの初期投入にのみ使用し、以降はアプリ内で変更を管理する。

### PM ロールの追加
`types/index.ts` の `Role` 型に `"pm"` を追加済み。既存 DB（SQLite）には `runMigrations()` で PM の role_targets を自動補完する（PL と同値がデフォルト、管理画面で調整可能）。

### 履歴管理
`assessments` は追記型（同一 skill_item_id に複数レコードが入る）。
`getAssessmentSessions(userId)` で診断日一覧を取得し、個人ダッシュボードで複数セッションの比較・編集・削除ができる。

### Firestore 読み取り最適化（summaries コレクション）
`summaries/{uid}` に最新評価スナップショットを非正規化保持する。
チームダッシュボードは summaries のみ読み（N reads）、`assessments` を直接読まない。
評価保存時に `assessments` と `summaries` の両方を更新する。
既存データの移行は `/admin` の「サマリーを再構築する」ボタンで実行する。

### 管理者制御（Firestore モード）
`NEXT_PUBLIC_ADMIN_EMAILS` 環境変数にカンマ区切りでメールアドレスを設定すると、そのユーザーのみ `/admin` にアクセスできる。未設定時はログイン済み全員が管理者扱い（初期セットアップ用）。

---

## ビジネスロジック

- `lib/domain/scoring.ts` — ギャップ計算・優先度算出・育成アクション提案（純粋関数）
  - `calcGap(currentLevel, targetLevel)` → ギャップ数値
  - `calcPriority(currentLevel, targetLevel)` → high/medium/low
  - `suggestAction(currentLevel, targetLevel)` → 育成アクション文言
  - `buildGapAnalysis(...)` → 全項目のギャップ分析
  - `aggregateCategoryScores(...)` → カテゴリ別平均スコア

---

## スコープ管理

### 実装済み
- [x] 名前・ロール入力（新規 / 続きから の 2 タブ）
- [x] PMロール追加（4ロール: 開発者/PL/PM/推進者）
- [x] スキル評価フォーム（10カテゴリ・53項目、Lv0〜3 + 根拠テキスト・前回値 pre-fill・次カテゴリボタン）
- [x] 個人ダッシュボード（レーダーチャート・ギャップ一覧・育成アクション・履歴比較・セッション編集/削除）
- [x] チームダッシュボード（レーダーチャート・カテゴリ別平均・弱点サマリ・ヒートマップ（番号順））
- [x] マスタ管理画面（カテゴリ・スキル項目・ロール別目標Lv・ユーザー管理）
- [x] スキルマップ.md エクスポート（管理画面から生成）
- [x] SQLite 永続化 + Repository パターン
- [x] Firestore 実装（DB_BACKEND=firestore で切り替え）
- [x] Firebase Auth（Google、Firestore モード）
- [x] Firestore 読み取り最適化（summaries コレクション、98% read 削減）
- [x] 管理者制御（NEXT_PUBLIC_ADMIN_EMAILS）
- [x] ユーザー設定画面（表示名・ロール変更・アカウント削除）
- [x] ビジネスロジックのユニットテスト

### 未実装（将来対応）
- 上長評価機能（自己評価と上長評価の乖離分析）
- CSV/Excel エクスポート
- スキルマップのバージョン管理（変更履歴）
