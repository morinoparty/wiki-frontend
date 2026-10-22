# コーディングプラクティス

## 実装手順

1. **型設計**
   - まず型 (interface / type) と Zod スキーマを定義

2. **純粋関数から実装**
   - 外部依存のない関数を先に実装

## プラクティス

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- コードよりも型を重視
- 複雑さに応じてアプローチを調整

## パッケージマネージャー

- 必ず **pnpm** を使ってください (`pnpm install`, `pnpm add <pkg>`, `pnpm run <script>`)。
- npm / npx は使いません。`npx` の代わりに `pnpm exec <cmd>` / `pnpm dlx <pkg>` を使ってください。
- このマシンでは npm は意図的にアンインストールされています。npm を再インストールしないでください (apt / brew / `corepack enable npm` などすべて禁止)。`npm` / `npx` が見つからない・失敗するのは正常な状態です。
- Node.js 26.12 以上 (`.node-version`)、pnpm 12 (`packageManager`) を使います。

## コマンド

- `pnpm install` - 依存関係のインストール (`prepare` で `panda codegen` も走る)
- `pnpm run dev` - ライセンス一覧と検索 index を生成してから `cf dev`
- `pnpm run build` - 生成してから `cf build` (Vite + TanStack Start。出力は `.cloudflare/output`。`cf build` は `--mode` を渡せない)
- `pnpm run typecheck` - `cf workers types && tsc --noEmit`
- `pnpm run generate` - `generate:license` + `generate:index` (`cf build` の前に必要。`cf` は package.json の scripts を通らない)
- `pnpm exec cf deploy --dry-run` - 認証情報なしでデプロイを検証する
- `pnpm exec tsr generate` - `src/routeTree.gen.ts` の再生成 (通常は Vite プラグインが生成する)

`cloudflare.config.ts` のないディレクトリで `cf dev` / `cf build` / `cf deploy` を実行しないでください。

## コードスタイル

- 常に既存コードの設計や記法を参考にしてください。
- 書籍「リーダブルコード」のようなベストプラクティスを常に適用してください。
- コードの意図・背景などのコメントを日本語で積極的に入れてください。また関数には JSDoc を入れることが推奨されます。
- TypeScript は strict に書き、入力の検証には Zod スキーマを使ってください。
- import には `@/` エイリアス (`src/` を指す) を使ってください。
- コードを書いた後は、`pnpm run typecheck` と `pnpm run build` を実行して、型チェックとビルドが通ることを確認してください。
- このリポジトリには Linter / Formatter やテストの設定はありません。

## 補足

- `src/routeTree.gen.ts` は自動生成されます。手で編集しないでください。
- `styled-system/` は Panda の生成物 (gitignore 済み) です。手で編集しないでください。
- `src/generated/license.json` と `public/search-index.json` は `pnpm run generate` の生成物 (gitignore 済み) です。
