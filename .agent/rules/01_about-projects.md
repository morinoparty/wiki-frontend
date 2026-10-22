## このアプリケーションの概要
「もりぱうぃき (MoripaWiki)」の閲覧・編集 UI です。
リポジトリ名は `wiki-frontend` です。

**TanStack Start** のアプリケーション (`src/routes` のファイルベースルーティング、SSR + server function) で、
Cloudflare Workers に Worker `wiki-frontend` として `cf` CLI でデプロイします。
配信は workers.dev のみで、独自ドメインは持ちません (`https://wiki-frontend.<subdomain>.workers.dev`)。
Worker の設定とバインディングは `cloudflare.config.ts` にあります。

## 目的
morinoparty の wiki 記事を公開ページとして表示し、ログインしたユーザーがダッシュボードのエディタから記事を作成・編集できるようにします。

- 公開ページは配信中の wiki-content (`article.json` など) を読みます
- 編集はダッシュボードから行い、保存すると hagaki が wiki-content へコミットします。wiki-content の Actions がデプロイすると公開ページに反映されます
- 検索はクライアント側の FlexSearch で行います (`public/search-index.json` をビルド時に生成)

## コンテンツ
コンテンツは別リポジトリ [morinoparty/wiki-content](https://github.com/morinoparty/wiki-content) に hagaki のコンテンツフォーマットで置かれています。

- `/content/article/<uuid>/index.mdx` - 記事本文 (frontmatter + MDX)
- `/content/article/<uuid>/assets/<imageId>.avif` - その記事が持つ画像
- `/content/categories/<slug>.json` - カテゴリ定義

slug は変わりうるため、パスは uuid ベースです。
読み取りは `CONTENT_BASE_URL` (`src/lib/content.ts`、workers.dev 上の Worker `wiki-content`) の配信コピーを経由します
(マニフェスト: `article.json`、`slug-index.json`、記事ごとの `info.json`)。
書き込みは hagaki (`src/lib/hagaki.ts`、サーバー専用) によるリポジトリへのコミットです。

## 主な技術スタック
- **TanStack Start / Router** + Vite 8 + `@cloudflare/vite-plugin` (v2 beta) + `cf` (Cloudflare CLI, beta)
- React 19 / TypeScript
- **chlorophyll (`@morinoparty/chlorophyll-react`) + Panda CSS** (スタイリング。`colorPalette: mori`)
- Ark UI (`@ark-ui/react`)、アイコンは `lucide-react`
- **hagaki (`@morinoparty/hagaki`)** (コンテンツの読み書き、エディタ、ブラウザでの画像エンコード)
- MDXEditor (`@mdxeditor/editor`) / unified (remark / rehype) による Markdown 表示
- **better-auth** (DB なし。MineAuth に対する generic OAuth)
- **FlexSearch** (クライアント側検索)
- Zod (入力バリデーション)
- GitHub Actions (`.github/workflows/deploy.yml`)

`@morinoparty/chlorophyll-react` は GitHub Packages から入れるため (`.npmrc` のレジストリ指定)、
`~/.npmrc` に `//npm.pkg.github.com/:_authToken=<read:packages の PAT>` が必要です。

## 経緯
もともとは vinext (Vite 上の Next.js API) で書かれていましたが、TanStack Start へ移行しました。
`.gitignore` や `pnpm-workspace.yaml` に vinext の名残がありますが、`next/*` や vinext の API は使わないでください。
