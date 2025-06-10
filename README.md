# MoripaWiki

MoripaWiki は Next.js 15 で構築された Wiki アプリケーションです。Chakra UI と Panda CSS を組み合わせ、OpenNext を介して Cloudflare Workers 上で動作します。

## ディレクトリ構成

- `src/actions/` – サーバーサイド API を Server Actions として実装
- `src/app/` – App Router によるページ群
- `src/components/` – 再利用可能な UI コンポーネント
- `src/lib/` – 認証やデータ取得のユーティリティ
- `src/theme/` – Chakra/Panda のテーマ定義
- `tokens/` – Panda CSS 用カラープリセット

## CMS の概要

GitHub リポジトリが CMS となり、以下のディレクトリの内容がそのまま静的ファイルとして配信されます。

- `/content/wiki/` – 記事 Markdown
- `/content/categories/` – カテゴリ定義
- `/content/img/` – 画像アセット
- `/content/users/` – ユーザー情報

Markdown をコミットすると `wiki-contentdev.yahiro.workers.dev/wiki/[slug].md` で取得可能です。画像も同様に `/content/img` へコミットすれば展開されます。記事の作成・更新は `src/actions` から GitHub へコミットする仕組みで行われ、履歴やレビューも GitHub 上で管理されます。

## Actions API

`src/actions` には記事管理用の Server Actions がまとまっています。主な機能は次のとおりです。

- **Core**: `createPost` `updatePost` `deletePost` `lockPost` `unlockPost` `changePostStatus` `transferPostOwnership`
- **Query**: `getAllPosts` `getPost` `getPostsByCategory` `searchPosts` `getUserPosts`
- **Batch**: `batchDeletePosts` `batchChangePostsStatus` `duplicatePost`
- **History**: `getPostHistory` `restorePostVersion` `getPostDiff`
- **Stats**: `getSystemStats` `getUserStats` `healthCheck`

どの関数も `ApiResult<T>` 型を返し、`success` と `error`、必要に応じて `data` や `commitId` を含みます。詳細な使用例や拡張方法、権限制御の仕組みは [`src/actions/README.md`](src/actions/README.md) を参照してください。

## 必要な環境変数

`.env.local` に下記を設定する必要があります。

```
GITHUB_TOKEN=your_token
ADMIN_USERS=user1,user2
MAIN_SERVER_URL=https://auth.example.com
CLIENT_ID=your_client_id
AUTH_URL=https://your.app/auth
AUTH_SECRET=your_auth_secret
```

## 開発手順

1. **依存関係のインストール** – `pnpm install`
2. **開発サーバー起動** – `pnpm dev` (初回は `panda codegen` が実行されます)
3. **コード確認** – `src/actions/services/github-service.ts` を中心に Server Actions の実装を把握し、`src/app` や `src/components` を閲覧します
4. **デプロイ** – `pnpm deploy` で OpenNext ビルド後、wrangler を使って Cloudflare にデプロイ

## コンポーネント実装ガイド

1. `src/components` 配下にコンポーネントファイルを作成し、必ず `export` する
2. スタイルは PandaCSS の `sva` 関数を用いて記述し、`src/theme` のトークンを参照する
3. ロジックはカスタムフックやユーティリティに切り出し、表示コンポーネントはシンプルに保つ
4. グローバル CSS は極力使わず、Panda の Recipe/Token を活用して一貫したデザインを維持する

新規参加者はまず `src/actions/README.md` を読み、API の利用方法と拡張方法を把握することを推奨します。React Server Components を主体に実装し、API Route でのロジックは必要最小限に留めてください。

## 新規参加者向けガイド

- `src` ディレクトリ内の各フォルダを確認し、アプリ全体の構造を把握します。
- CMS は GitHub 上の `/content` 配下ファイルで管理され、コミットがそのまま Cloudflare にデプロイされます。
- 環境変数を `.env.local` に設定したら `pnpm install` → `pnpm dev` で開発を始めます。
- `src/actions/README.md` で Server Actions の詳細や GitHubService の実装を確認します。
- デザインは PandaCSS の `sva` とトークン/レシピを活用してください。
- デプロイは `pnpm deploy` 実行後、wrangler で Cloudflare Workers へ公開します。
