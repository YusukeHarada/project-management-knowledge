import type { Role, Level } from "@/types"

export interface SeedCategory {
  id: string
  name: string
  order: number
}

export interface SeedSkillItem {
  id: string
  categoryId: string
  number: string
  label: string
  order: number
}

export interface SeedRoleTarget {
  skillItemId: string
  role: Role
  targetLevel: Level
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { id: "cat1", name: "プロセス理解・標準", order: 1 },
  { id: "cat2", name: "要件管理", order: 2 },
  { id: "cat3", name: "設計・実装", order: 3 },
  { id: "cat4", name: "検証・テスト", order: 4 },
  { id: "cat5", name: "構成管理・変更管理", order: 5 },
  { id: "cat6", name: "プロジェクト管理", order: 6 },
  { id: "cat7", name: "コミュニケーション・ドキュメント", order: 7 },
  { id: "cat8", name: "プロセス改善", order: 8 },
  { id: "cat9", name: "機能安全（ISO 26262）", order: 9 },
  { id: "cat10", name: "サイバーセキュリティ（ISO/SAE 21434）", order: 10 },
]

export const SEED_SKILL_ITEMS: SeedSkillItem[] = [
  // カテゴリ1
  { id: "1-1", categoryId: "cat1", number: "1-1", label: "開発プロセス（V字モデル・ウォーターフォール）の全体像を説明できる", order: 1 },
  { id: "1-2", categoryId: "cat1", number: "1-2", label: "各工程の入口・出口基準（Entry/Exit Criteria）を定義・運用できる", order: 2 },
  { id: "1-3", categoryId: "cat1", number: "1-3", label: "A-SPICE等の業界標準の概要・目的・自組織プロセスとのマッピングを説明できる", order: 3 },
  { id: "1-4", categoryId: "cat1", number: "1-4", label: "要件・設計・テストのトレーサビリティの概念を理解し運用・改善できる", order: 4 },
  // カテゴリ2
  { id: "2-1", categoryId: "cat2", number: "2-1", label: "ソフトウェア要件を明確に記述できる（SHALL文・曖昧さのない表現）", order: 1 },
  { id: "2-2", categoryId: "cat2", number: "2-2", label: "システム要件からソフトウェア要件への展開ができる", order: 2 },
  { id: "2-3", categoryId: "cat2", number: "2-3", label: "要件の変更要求を起票・追跡・管理できる", order: 3 },
  { id: "2-4", categoryId: "cat2", number: "2-4", label: "非機能要件（性能・安全・セキュリティ・リアルタイム制約）を定義できる", order: 4 },
  // カテゴリ3
  { id: "3-1", categoryId: "cat3", number: "3-1", label: "アーキテクチャ設計・モジュール分割ができる", order: 1 },
  { id: "3-2", categoryId: "cat3", number: "3-2", label: "HW/SW境界を定義し、HW制約（電源・割り込み・バス負荷等）をSW設計の前提として扱える", order: 2 },
  { id: "3-3", categoryId: "cat3", number: "3-3", label: "チーム間・モジュール間のインターフェース仕様を定義・合意できる", order: 3 },
  { id: "3-4", categoryId: "cat3", number: "3-4", label: "詳細設計書を作成できる（状態遷移・シーケンス図等）", order: 4 },
  { id: "3-5", categoryId: "cat3", number: "3-5", label: "コーディング規約（MISRA-C等）に従って実装できる", order: 5 },
  { id: "3-6", categoryId: "cat3", number: "3-6", label: "デバッグ・問題の切り分けができる（ハードウェア起因との区別含む）", order: 6 },
  { id: "3-7", categoryId: "cat3", number: "3-7", label: "デバッグ環境（JTAG・ロジアナ等）のセットアップを文書化・再現できる", order: 7 },
  { id: "3-8", categoryId: "cat3", number: "3-8", label: "リアルタイム制約（CPUサイクル・スタック・割り込みレイテンシ等）を評価・説明できる", order: 8 },
  // カテゴリ4
  { id: "4-1", categoryId: "cat4", number: "4-1", label: "テスト計画を立案できる（テスト観点・網羅性・テスト階層の定義）", order: 1 },
  { id: "4-2", categoryId: "cat4", number: "4-2", label: "単体テストを設計・実施・記録できる", order: 2 },
  { id: "4-3", categoryId: "cat4", number: "4-3", label: "統合テスト・システムテストを計画・実施・記録できる", order: 3 },
  { id: "4-4", categoryId: "cat4", number: "4-4", label: "MIL/SIL/HILの各検証階層の目的を理解し、適切なテストをどの階層で実施するか判断できる", order: 4 },
  { id: "4-5", categoryId: "cat4", number: "4-5", label: "静的解析ツール（MISRA-Cチェッカ等）を活用できる", order: 5 },
  { id: "4-6", categoryId: "cat4", number: "4-6", label: "CI（継続的インテグレーション）の概念を理解し、自動ビルド・自動テストのパイプラインを活用できる", order: 6 },
  { id: "4-7", categoryId: "cat4", number: "4-7", label: "テスト結果を評価し合否判定できる", order: 7 },
  { id: "4-8", categoryId: "cat4", number: "4-8", label: "レビュー（設計レビュー・コードレビュー）を実施・記録できる", order: 8 },
  // カテゴリ5
  { id: "5-1", categoryId: "cat5", number: "5-1", label: "バージョン管理ツール（Git等）の基本操作ができる", order: 1 },
  { id: "5-2", categoryId: "cat5", number: "5-2", label: "ブランチ戦略を理解しチームルールに従って運用できる", order: 2 },
  { id: "5-3", categoryId: "cat5", number: "5-3", label: "変更の影響範囲を分析し関係者に通知できる", order: 3 },
  { id: "5-4", categoryId: "cat5", number: "5-4", label: "成果物（バイナリ・ドキュメント）のバージョンを管理できる", order: 4 },
  { id: "5-5", categoryId: "cat5", number: "5-5", label: "構成品目を識別しベースラインを設定・管理できる（CM計画の運用）", order: 5 },
  // カテゴリ6
  { id: "6-1", categoryId: "cat6", number: "6-1", label: "作業をタスクに分解し工数を見積もれる", order: 1 },
  { id: "6-2", categoryId: "cat6", number: "6-2", label: "進捗を定期的に把握・報告できる", order: 2 },
  { id: "6-3", categoryId: "cat6", number: "6-3", label: "遅延・ブロックを早期に検知し上位にエスカレーションできる", order: 3 },
  { id: "6-4", categoryId: "cat6", number: "6-4", label: "リスクを識別・評価し対処策を立案できる", order: 4 },
  { id: "6-5", categoryId: "cat6", number: "6-5", label: "課題を起票・追跡・クローズまで管理できる", order: 5 },
  { id: "6-6", categoryId: "cat6", number: "6-6", label: "外部委託先への指示を文書化し成果物を受け入れ確認できる", order: 6 },
  // カテゴリ7
  { id: "7-1", categoryId: "cat7", number: "7-1", label: "設計書・手順書を第三者が理解できる形で作成できる（物理量・単位・スケーリング係数を含む）", order: 1 },
  { id: "7-2", categoryId: "cat7", number: "7-2", label: "仕様不明・判断不能な場合に適切にエスカレーションできる", order: 2 },
  { id: "7-3", categoryId: "cat7", number: "7-3", label: "レビューで建設的なフィードバックを与えられる", order: 3 },
  { id: "7-4", categoryId: "cat7", number: "7-4", label: "上位者（PM・部長）への報告資料を作成・説明できる", order: 4 },
  { id: "7-5", categoryId: "cat7", number: "7-5", label: "チーム横断の調整・合意形成ができる", order: 5 },
  { id: "7-6", categoryId: "cat7", number: "7-6", label: "改善活動に対する組織の抵抗・懸念を把握し、ステークホルダーを巻き込める（チェンジマネジメント）", order: 6 },
  // カテゴリ8
  { id: "8-1", categoryId: "cat8", number: "8-1", label: "作業の中で問題・非効率を発見し言語化できる", order: 1 },
  { id: "8-2", categoryId: "cat8", number: "8-2", label: "問題の根本原因を分析できる（なぜなぜ分析等）", order: 2 },
  { id: "8-3", categoryId: "cat8", number: "8-3", label: "改善策を立案し関係者に提案できる", order: 3 },
  { id: "8-4", categoryId: "cat8", number: "8-4", label: "改善の効果をメトリクスで計測・評価できる（品質・工数指標の読解を含む）", order: 4 },
  { id: "8-5", categoryId: "cat8", number: "8-5", label: "振り返り（レトロスペクティブ）を運営・活用できる", order: 5 },
  // カテゴリ9
  { id: "9-1", categoryId: "cat9", number: "9-1", label: "ISO 26262の概要・ASIL分類（A〜D）の考え方を説明できる", order: 1 },
  { id: "9-2", categoryId: "cat9", number: "9-2", label: "ソフトウェア安全要件（SSR）を要件管理の中で追跡・管理できる", order: 2 },
  { id: "9-3", categoryId: "cat9", number: "9-3", label: "SW設計・実装における安全機構（監視・フェイルセーフ等）の意図を理解できる", order: 3 },
  { id: "9-4", categoryId: "cat9", number: "9-4", label: "安全分析（FMEA・FMEDA等）の結果を読解し、設計・テストに反映できる", order: 4 },
  // カテゴリ10
  { id: "10-1", categoryId: "cat10", number: "10-1", label: "ISO/SAE 21434の概要とTARA（脅威分析・リスク評価）の概念を説明できる", order: 1 },
  { id: "10-2", categoryId: "cat10", number: "10-2", label: "セキュアコーディングの基本原則（入力検証・バッファ管理等）を理解し実践できる", order: 2 },
  { id: "10-3", categoryId: "cat10", number: "10-3", label: "セキュリティ要件を通常の機能要件と区別して管理・追跡できる", order: 3 },
]

export const SEED_ROLE_TARGETS: SeedRoleTarget[] = [
  // カテゴリ1
  { skillItemId: "1-1", role: "developer", targetLevel: 1 }, { skillItemId: "1-1", role: "pl", targetLevel: 2 }, { skillItemId: "1-1", role: "pm", targetLevel: 2 }, { skillItemId: "1-1", role: "promoter", targetLevel: 3 },
  { skillItemId: "1-2", role: "developer", targetLevel: 1 }, { skillItemId: "1-2", role: "pl", targetLevel: 2 }, { skillItemId: "1-2", role: "pm", targetLevel: 2 }, { skillItemId: "1-2", role: "promoter", targetLevel: 3 },
  { skillItemId: "1-3", role: "developer", targetLevel: 0 }, { skillItemId: "1-3", role: "pl", targetLevel: 2 }, { skillItemId: "1-3", role: "pm", targetLevel: 2 }, { skillItemId: "1-3", role: "promoter", targetLevel: 3 },
  { skillItemId: "1-4", role: "developer", targetLevel: 1 }, { skillItemId: "1-4", role: "pl", targetLevel: 2 }, { skillItemId: "1-4", role: "pm", targetLevel: 2 }, { skillItemId: "1-4", role: "promoter", targetLevel: 3 },
  // カテゴリ2
  { skillItemId: "2-1", role: "developer", targetLevel: 1 }, { skillItemId: "2-1", role: "pl", targetLevel: 2 }, { skillItemId: "2-1", role: "pm", targetLevel: 2 }, { skillItemId: "2-1", role: "promoter", targetLevel: 2 },
  { skillItemId: "2-2", role: "developer", targetLevel: 1 }, { skillItemId: "2-2", role: "pl", targetLevel: 2 }, { skillItemId: "2-2", role: "pm", targetLevel: 2 }, { skillItemId: "2-2", role: "promoter", targetLevel: 1 },
  { skillItemId: "2-3", role: "developer", targetLevel: 1 }, { skillItemId: "2-3", role: "pl", targetLevel: 2 }, { skillItemId: "2-3", role: "pm", targetLevel: 2 }, { skillItemId: "2-3", role: "promoter", targetLevel: 2 },
  { skillItemId: "2-4", role: "developer", targetLevel: 1 }, { skillItemId: "2-4", role: "pl", targetLevel: 2 }, { skillItemId: "2-4", role: "pm", targetLevel: 2 }, { skillItemId: "2-4", role: "promoter", targetLevel: 1 },
  // カテゴリ3
  { skillItemId: "3-1", role: "developer", targetLevel: 2 }, { skillItemId: "3-1", role: "pl", targetLevel: 2 }, { skillItemId: "3-1", role: "pm", targetLevel: 2 }, { skillItemId: "3-1", role: "promoter", targetLevel: 1 },
  { skillItemId: "3-2", role: "developer", targetLevel: 2 }, { skillItemId: "3-2", role: "pl", targetLevel: 3 }, { skillItemId: "3-2", role: "pm", targetLevel: 3 }, { skillItemId: "3-2", role: "promoter", targetLevel: 1 },
  { skillItemId: "3-3", role: "developer", targetLevel: 1 }, { skillItemId: "3-3", role: "pl", targetLevel: 3 }, { skillItemId: "3-3", role: "pm", targetLevel: 3 }, { skillItemId: "3-3", role: "promoter", targetLevel: 1 },
  { skillItemId: "3-4", role: "developer", targetLevel: 3 }, { skillItemId: "3-4", role: "pl", targetLevel: 2 }, { skillItemId: "3-4", role: "pm", targetLevel: 2 }, { skillItemId: "3-4", role: "promoter", targetLevel: 1 },
  { skillItemId: "3-5", role: "developer", targetLevel: 3 }, { skillItemId: "3-5", role: "pl", targetLevel: 2 }, { skillItemId: "3-5", role: "pm", targetLevel: 2 }, { skillItemId: "3-5", role: "promoter", targetLevel: 0 },
  { skillItemId: "3-6", role: "developer", targetLevel: 3 }, { skillItemId: "3-6", role: "pl", targetLevel: 2 }, { skillItemId: "3-6", role: "pm", targetLevel: 2 }, { skillItemId: "3-6", role: "promoter", targetLevel: 0 },
  { skillItemId: "3-7", role: "developer", targetLevel: 2 }, { skillItemId: "3-7", role: "pl", targetLevel: 1 }, { skillItemId: "3-7", role: "pm", targetLevel: 1 }, { skillItemId: "3-7", role: "promoter", targetLevel: 0 },
  { skillItemId: "3-8", role: "developer", targetLevel: 2 }, { skillItemId: "3-8", role: "pl", targetLevel: 2 }, { skillItemId: "3-8", role: "pm", targetLevel: 2 }, { skillItemId: "3-8", role: "promoter", targetLevel: 0 },
  // カテゴリ4
  { skillItemId: "4-1", role: "developer", targetLevel: 1 }, { skillItemId: "4-1", role: "pl", targetLevel: 2 }, { skillItemId: "4-1", role: "pm", targetLevel: 2 }, { skillItemId: "4-1", role: "promoter", targetLevel: 1 },
  { skillItemId: "4-2", role: "developer", targetLevel: 3 }, { skillItemId: "4-2", role: "pl", targetLevel: 2 }, { skillItemId: "4-2", role: "pm", targetLevel: 2 }, { skillItemId: "4-2", role: "promoter", targetLevel: 0 },
  { skillItemId: "4-3", role: "developer", targetLevel: 2 }, { skillItemId: "4-3", role: "pl", targetLevel: 2 }, { skillItemId: "4-3", role: "pm", targetLevel: 2 }, { skillItemId: "4-3", role: "promoter", targetLevel: 0 },
  { skillItemId: "4-4", role: "developer", targetLevel: 1 }, { skillItemId: "4-4", role: "pl", targetLevel: 2 }, { skillItemId: "4-4", role: "pm", targetLevel: 2 }, { skillItemId: "4-4", role: "promoter", targetLevel: 1 },
  { skillItemId: "4-5", role: "developer", targetLevel: 2 }, { skillItemId: "4-5", role: "pl", targetLevel: 2 }, { skillItemId: "4-5", role: "pm", targetLevel: 2 }, { skillItemId: "4-5", role: "promoter", targetLevel: 0 },
  { skillItemId: "4-6", role: "developer", targetLevel: 1 }, { skillItemId: "4-6", role: "pl", targetLevel: 2 }, { skillItemId: "4-6", role: "pm", targetLevel: 2 }, { skillItemId: "4-6", role: "promoter", targetLevel: 1 },
  { skillItemId: "4-7", role: "developer", targetLevel: 2 }, { skillItemId: "4-7", role: "pl", targetLevel: 3 }, { skillItemId: "4-7", role: "pm", targetLevel: 3 }, { skillItemId: "4-7", role: "promoter", targetLevel: 0 },
  { skillItemId: "4-8", role: "developer", targetLevel: 2 }, { skillItemId: "4-8", role: "pl", targetLevel: 3 }, { skillItemId: "4-8", role: "pm", targetLevel: 3 }, { skillItemId: "4-8", role: "promoter", targetLevel: 1 },
  // カテゴリ5
  { skillItemId: "5-1", role: "developer", targetLevel: 2 }, { skillItemId: "5-1", role: "pl", targetLevel: 2 }, { skillItemId: "5-1", role: "pm", targetLevel: 2 }, { skillItemId: "5-1", role: "promoter", targetLevel: 1 },
  { skillItemId: "5-2", role: "developer", targetLevel: 2 }, { skillItemId: "5-2", role: "pl", targetLevel: 2 }, { skillItemId: "5-2", role: "pm", targetLevel: 2 }, { skillItemId: "5-2", role: "promoter", targetLevel: 1 },
  { skillItemId: "5-3", role: "developer", targetLevel: 1 }, { skillItemId: "5-3", role: "pl", targetLevel: 3 }, { skillItemId: "5-3", role: "pm", targetLevel: 3 }, { skillItemId: "5-3", role: "promoter", targetLevel: 1 },
  { skillItemId: "5-4", role: "developer", targetLevel: 2 }, { skillItemId: "5-4", role: "pl", targetLevel: 2 }, { skillItemId: "5-4", role: "pm", targetLevel: 2 }, { skillItemId: "5-4", role: "promoter", targetLevel: 1 },
  { skillItemId: "5-5", role: "developer", targetLevel: 1 }, { skillItemId: "5-5", role: "pl", targetLevel: 2 }, { skillItemId: "5-5", role: "pm", targetLevel: 2 }, { skillItemId: "5-5", role: "promoter", targetLevel: 2 },
  // カテゴリ6
  { skillItemId: "6-1", role: "developer", targetLevel: 2 }, { skillItemId: "6-1", role: "pl", targetLevel: 3 }, { skillItemId: "6-1", role: "pm", targetLevel: 3 }, { skillItemId: "6-1", role: "promoter", targetLevel: 2 },
  { skillItemId: "6-2", role: "developer", targetLevel: 2 }, { skillItemId: "6-2", role: "pl", targetLevel: 3 }, { skillItemId: "6-2", role: "pm", targetLevel: 3 }, { skillItemId: "6-2", role: "promoter", targetLevel: 2 },
  { skillItemId: "6-3", role: "developer", targetLevel: 1 }, { skillItemId: "6-3", role: "pl", targetLevel: 3 }, { skillItemId: "6-3", role: "pm", targetLevel: 3 }, { skillItemId: "6-3", role: "promoter", targetLevel: 2 },
  { skillItemId: "6-4", role: "developer", targetLevel: 1 }, { skillItemId: "6-4", role: "pl", targetLevel: 2 }, { skillItemId: "6-4", role: "pm", targetLevel: 2 }, { skillItemId: "6-4", role: "promoter", targetLevel: 3 },
  { skillItemId: "6-5", role: "developer", targetLevel: 1 }, { skillItemId: "6-5", role: "pl", targetLevel: 3 }, { skillItemId: "6-5", role: "pm", targetLevel: 3 }, { skillItemId: "6-5", role: "promoter", targetLevel: 2 },
  { skillItemId: "6-6", role: "developer", targetLevel: 0 }, { skillItemId: "6-6", role: "pl", targetLevel: 3 }, { skillItemId: "6-6", role: "pm", targetLevel: 3 }, { skillItemId: "6-6", role: "promoter", targetLevel: 2 },
  // カテゴリ7
  { skillItemId: "7-1", role: "developer", targetLevel: 2 }, { skillItemId: "7-1", role: "pl", targetLevel: 2 }, { skillItemId: "7-1", role: "pm", targetLevel: 2 }, { skillItemId: "7-1", role: "promoter", targetLevel: 2 },
  { skillItemId: "7-2", role: "developer", targetLevel: 2 }, { skillItemId: "7-2", role: "pl", targetLevel: 3 }, { skillItemId: "7-2", role: "pm", targetLevel: 3 }, { skillItemId: "7-2", role: "promoter", targetLevel: 2 },
  { skillItemId: "7-3", role: "developer", targetLevel: 2 }, { skillItemId: "7-3", role: "pl", targetLevel: 3 }, { skillItemId: "7-3", role: "pm", targetLevel: 3 }, { skillItemId: "7-3", role: "promoter", targetLevel: 2 },
  { skillItemId: "7-4", role: "developer", targetLevel: 0 }, { skillItemId: "7-4", role: "pl", targetLevel: 2 }, { skillItemId: "7-4", role: "pm", targetLevel: 2 }, { skillItemId: "7-4", role: "promoter", targetLevel: 3 },
  { skillItemId: "7-5", role: "developer", targetLevel: 0 }, { skillItemId: "7-5", role: "pl", targetLevel: 2 }, { skillItemId: "7-5", role: "pm", targetLevel: 2 }, { skillItemId: "7-5", role: "promoter", targetLevel: 3 },
  { skillItemId: "7-6", role: "developer", targetLevel: 0 }, { skillItemId: "7-6", role: "pl", targetLevel: 1 }, { skillItemId: "7-6", role: "pm", targetLevel: 1 }, { skillItemId: "7-6", role: "promoter", targetLevel: 3 },
  // カテゴリ8
  { skillItemId: "8-1", role: "developer", targetLevel: 2 }, { skillItemId: "8-1", role: "pl", targetLevel: 2 }, { skillItemId: "8-1", role: "pm", targetLevel: 2 }, { skillItemId: "8-1", role: "promoter", targetLevel: 3 },
  { skillItemId: "8-2", role: "developer", targetLevel: 1 }, { skillItemId: "8-2", role: "pl", targetLevel: 2 }, { skillItemId: "8-2", role: "pm", targetLevel: 2 }, { skillItemId: "8-2", role: "promoter", targetLevel: 3 },
  { skillItemId: "8-3", role: "developer", targetLevel: 1 }, { skillItemId: "8-3", role: "pl", targetLevel: 2 }, { skillItemId: "8-3", role: "pm", targetLevel: 2 }, { skillItemId: "8-3", role: "promoter", targetLevel: 3 },
  { skillItemId: "8-4", role: "developer", targetLevel: 1 }, { skillItemId: "8-4", role: "pl", targetLevel: 2 }, { skillItemId: "8-4", role: "pm", targetLevel: 2 }, { skillItemId: "8-4", role: "promoter", targetLevel: 3 },
  { skillItemId: "8-5", role: "developer", targetLevel: 1 }, { skillItemId: "8-5", role: "pl", targetLevel: 2 }, { skillItemId: "8-5", role: "pm", targetLevel: 2 }, { skillItemId: "8-5", role: "promoter", targetLevel: 3 },
  // カテゴリ9
  { skillItemId: "9-1", role: "developer", targetLevel: 1 }, { skillItemId: "9-1", role: "pl", targetLevel: 2 }, { skillItemId: "9-1", role: "pm", targetLevel: 2 }, { skillItemId: "9-1", role: "promoter", targetLevel: 2 },
  { skillItemId: "9-2", role: "developer", targetLevel: 1 }, { skillItemId: "9-2", role: "pl", targetLevel: 2 }, { skillItemId: "9-2", role: "pm", targetLevel: 2 }, { skillItemId: "9-2", role: "promoter", targetLevel: 1 },
  { skillItemId: "9-3", role: "developer", targetLevel: 2 }, { skillItemId: "9-3", role: "pl", targetLevel: 2 }, { skillItemId: "9-3", role: "pm", targetLevel: 2 }, { skillItemId: "9-3", role: "promoter", targetLevel: 1 },
  { skillItemId: "9-4", role: "developer", targetLevel: 1 }, { skillItemId: "9-4", role: "pl", targetLevel: 2 }, { skillItemId: "9-4", role: "pm", targetLevel: 2 }, { skillItemId: "9-4", role: "promoter", targetLevel: 1 },
  // カテゴリ10
  { skillItemId: "10-1", role: "developer", targetLevel: 0 }, { skillItemId: "10-1", role: "pl", targetLevel: 1 }, { skillItemId: "10-1", role: "pm", targetLevel: 1 }, { skillItemId: "10-1", role: "promoter", targetLevel: 2 },
  { skillItemId: "10-2", role: "developer", targetLevel: 1 }, { skillItemId: "10-2", role: "pl", targetLevel: 1 }, { skillItemId: "10-2", role: "pm", targetLevel: 1 }, { skillItemId: "10-2", role: "promoter", targetLevel: 0 },
  { skillItemId: "10-3", role: "developer", targetLevel: 1 }, { skillItemId: "10-3", role: "pl", targetLevel: 2 }, { skillItemId: "10-3", role: "pm", targetLevel: 2 }, { skillItemId: "10-3", role: "promoter", targetLevel: 1 },
]
