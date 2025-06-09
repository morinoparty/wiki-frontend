# MoripaWiki

MoripaWiki は Next.js 15 をベースとした Wiki アプリケーションです。Chakra UI と Panda CSS を利用しており、OpenNext を通じて Cloudflare Workers 上で動作します。

## ディレクトリ構成

- `src/actions/` – 投稿作成や更新などを行う Server Actions API
- `src/app/` – App Router で構築されたページ群。ダッシュボードや一般ページを含む
- `src/components/` – 再利用可能な React コンポーネント (Button, LoginModal, PostBody など)
- `src/lib/` – 認証や記事取得などのクライアント向けユーティリティ
- `src/theme/` – Chakra と Panda CSS のテーマ関連ファイル
- `tokens/` – Panda CSS 用のカラープリセット

## 主要機能

- **Server Actions**: `src/actions` で実装された API 層。GitHub をバックエンドとして利用し、投稿の作成・更新、履歴取得、権限チェックなどを提供します
- **認証**: `src/lib/auth.ts` で NextAuth を設定し、MineAuth との OAuth 連携を行います
- **Cloudflare へのデプロイ**: `open-next.config.ts` と `wrangler.jsonc` で Worker 環境へのデプロイ設定が行われています
- **テーマシステム**: Chakra UI を拡張し、Panda CSS と連携してスタイリングを管理します

## 重要な注意点

- `src/actions/README.md` に `GITHUB_TOKEN` や `ADMIN_USERS` など必須の環境変数一覧が記載されています

## 新規参加者向けガイド

1. **環境変数の設定**
   `.env.local` に GitHub アクセスや認証に必要な変数を定義します (`GITHUB_TOKEN`, `ADMIN_USERS`, `MAIN_SERVER_URL`, `CLIENT_ID`, `AUTH_URL`, `AUTH_SECRET` など)
2. **依存関係のインストール**
   `pnpm install` を実行してパッケージを取得します
3. **開発サーバーの起動**
   `pnpm dev` で開発用サーバーを起動できます。`prepare` スクリプトで Panda のコード生成が走ります
4. **コードベースの把握**
   `src/actions/services/github-service.ts` や `src/components`、`src/app` を確認し、API と UI の構造を理解しましょう
5. **デプロイ確認**
   `pnpm deploy` で OpenNext を用いたビルドと Cloudflare へのデプロイを行えます
6. **テーマシステムの理解**
   `src/theme` 以下のトークンやレシピを読み、デザインシステムの仕組みを把握してください

これらを参考に、コードベースの全体像をつかみながら開発を進めてください。

## コンポーネント実装ガイド

1. **新規ファイルの作成**
   `src/components` 配下にコンポーネント名のファイルを作成し、`export` して再利用できる形にします。
2. **スタイル定義**
   CSS を記述する際は PandaCSS の `sva` 関数でスタイルオブジェクトを定義します。`src/theme` のトークンを使い、可読性を高めてください。
3. **構造の分離**
   レイアウト用のコンポーネントと表示用のコンポーネントは分け、必要に応じてフックやユーティリティにロジックを切り出します。
4. **共通規則**
   スタイルは極力コンポーネント内部で完結させ、グローバル CSS の利用は避けます。Panda の Recipe や Token を活用し、一貫した UI を保ちます。
