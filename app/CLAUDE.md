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
│   ├── admin/page.tsx                # マスタ管理（スキルマップ.md エクスポートボタン付き）
│   ├── (auth)/login/page.tsx         # Google ログイン画面（Firestore モードのみ使用）
│   └── api/
│       ├── users/route.ts
│       ├── assessments/route.ts
│       ├── master/route.ts
│       ├── master/categories/route.ts
│       ├── master/items/route.ts
│       └── admin/export-skillmap/route.ts  # スキルマップ.md 生成・書き出し
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
```

---

## 画面構成

| パス | 画面名 | 概要 |
|---|---|---|
| `/` | トップ | 新規登録 / 続きから診断する（2タブ） |
| `/assessment?userId=xxx` | スキル評価 | 53項目をLv0〜3で評価・前回値 pre-fill・カテゴリ遷移ボタン |
| `/dashboard/[userId]` | 個人ダッシュボード | レーダーチャート・ギャップ一覧・育成アクション・履歴比較 |
| `/dashboard/team` | チームダッシュボード | レーダーチャート・カテゴリ別平均・弱点サマリ・ヒートマップ |
| `/admin` | マスタ管理 | カテゴリ・スキル項目・ロール別目標Lv・スキルマップ.md 出力 |
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

### 履歴管理（SQLite モード）
`assessments` テーブルは追記型（同一 skill_item_id に複数レコードが入る）。
`getAssessmentSessions(userId)` で診断日一覧を取得し、個人ダッシュボードで前回比の比較列を表示する。

---

## ビジネスロジック

- `lib/domain/scoring.ts` — ギャップ計算・優先度算出・育成アクション提案（純粋関数）
  - `calcGap(currentLevel, targetLevel)` → ギャップ数値
  - `calcPriority(currentLevel, targetLevel)` → high/medium/low
  - `suggestAction(currentLevel, targetLevel)` → 育成アクション文言
  - `buildGapAnalysis(...)` → 全項目のギャップ分析
  - `aggregateCategoryScores(...)` → カテゴリ別平均スコア

---

## Vercel デプロイ時のハマりパターン

### 404: NOT_FOUND — Next.js アプリがサブディレクトリにある

**症状**: デプロイしても `404: NOT_FOUND` になる。

**原因**: Vercel がリポジトリルートを Next.js プロジェクトとして探すが、本プロジェクトは `app/` サブディレクトリにある。

**解決策**: Vercel ダッシュボード → Settings → Root Directory = `app` に設定 + `app/vercel.json` を追加。

---

### FirestoreSkillRepository is not a constructor

**症状**: `lib/db/index.ts` で `require("./firestore")` したクラスが `is not a constructor` になる。

**原因**: ES モジュール（`export class`）を `require()` で読み込もうとすると named export が取得できないことがある（Turbopack / Vercel 環境）。

**解決策**: `getRepository()` を `async` 関数にして `require()` を `await import()` に変更。呼び出し元（API ルート）も `await getRepository()` に変更。

---

### Vercel で Firebase Admin 初期化が失敗する（秘密鍵の `\n` 問題）

**症状**: ローカルでは動くが Vercel では API が 500 になる。

**原因**: Vercel の環境変数エディタを通すと `private_key` の改行（`\n`）が `\\n` のままになることがある。

**解決策**: `lib/firebase/admin.ts` で `JSON.parse` 後に `.replace(/\\n/g, "\n")` を適用（実装済み）。

---

### ERR_REQUIRE_ESM — firebase-admin/auth と jose の ESM/CJS 競合

**症状**: Vercel で `require() of ES Module jose/dist/webapi/index.js not supported` エラーで API が 500。

**原因**: `firebase-admin/auth` → `jwks-rsa` → `jose`（ESM only）の依存チェーンが Vercel の Node.js 環境で壊れる。

**解決策**: サーバー側 Auth トークン検証が不要な場合は `firebase-admin/auth` を import しない（`lib/firebase/admin.ts` では `getAuth` を import していない）。

---

### API 500 時に画面がクラッシュして無限リロードする

**症状**: API が 500 を返すとコンポーネントが `f.map is not a function` でクラッシュし、React が再マウントして無限ループになる。

**原因**: `fetch` のレスポンスをエラーチェックなしで配列として使っており、`{error: "..."}` オブジェクトに対して `.map()` が失敗する。

**解決策**: 全 fetch に try/catch と `Array.isArray()` チェックを追加し、エラー時は state に保存して画面に表示する。

---

## スコープ管理

### 実装済み
- [x] 名前・ロール入力（新規 / 続きから の 2 タブ）
- [x] PMロール追加（4ロール: 開発者/PL/PM/推進者）
- [x] スキル評価フォーム（10カテゴリ・53項目、Lv0〜3 + 根拠テキスト・前回値 pre-fill・次カテゴリボタン）
- [x] 個人ダッシュボード（レーダーチャート・ギャップ一覧・育成アクション・履歴比較）
- [x] チームダッシュボード（レーダーチャート・カテゴリ別平均・弱点サマリ・ヒートマップ（番号順））
- [x] マスタ管理画面（カテゴリ・スキル項目・ロール別目標Lv）
- [x] スキルマップ.md エクスポート（管理画面から生成）
- [x] SQLite 永続化 + Repository パターン
- [x] Firestore 実装（DB_BACKEND=firestore で切り替え）
- [x] Firebase Auth（Google、Firestore モード）
- [x] ビジネスロジックのユニットテスト

### 未実装（将来対応）
- 上長評価機能（自己評価と上長評価の乖離分析）
- CSV/Excel エクスポート
- スキルマップのバージョン管理（変更履歴）
