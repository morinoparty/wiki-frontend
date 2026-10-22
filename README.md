# wiki-frontend

MoripaWiki の閲覧・編集 UI。[TanStack Start](https://tanstack.com/start) で書いたアプリを
Cloudflare Workers で動かします。記事の読み書きは
[hagaki](https://github.com/morinoparty/hagaki) 経由です。

- 配信 URL: `https://wiki-frontend.<subdomain>.workers.dev` (Worker 名 `wiki-frontend`。独自ドメインなし)
- デプロイ: Cloudflare CLI [`cf`](https://developers.cloudflare.com/cf/) (beta)。main への push で GitHub Actions が実行
- コンテンツ: [morinoparty/wiki-content](https://github.com/morinoparty/wiki-content)
  (`https://wiki-content.<subdomain>.workers.dev` から配信)
- Minecraft のアセット: [morinoparty/mc-assets](https://github.com/morinoparty/mc-assets)
  (`https://mc-assets.morinoparty.workers.dev` から配信)

## 構成

```
.
├── cloudflare.config.ts        # Worker 定義 (名前、バインディング、secret)
├── vite.config.ts              # TanStack Start + Cloudflare Vite plugin
├── panda.config.ts             # Panda CSS (chlorophyll のプリセット)
├── .github/workflows/deploy.yml
└── src/
    ├── routes/                 # ファイルベースのルート (ページと server route)
    ├── router.tsx              # ルーター (routeTree.gen.ts は自動生成)
    ├── server/                 # server function (記事の作成・更新・履歴、データ取得、認証)
    ├── components/
    ├── lib/                    # hagaki client, 認証 (better-auth), env の読み出し
    └── generate-search-index.ts
```

- 公開ページは配信中の wiki-content (`article.json` など) を読みます。
  配信元は `src/lib/content.ts` の `CONTENT_BASE_URL`。
- 編集はダッシュボードから行い、保存すると hagaki が wiki-content へコミットします。
  wiki-content の Actions がデプロイすると公開ページに反映されます。
- エディタに入れた画像はブラウザで AVIF にし、保存時に本文と同じコミットへ入れます
  (詳細は [`src/server/README.md`](src/server/README.md))。
- Minecraft 系コンポーネント (chlorophyll の `MinecraftItem` など) は、`src/components/ui/provider.tsx` の
  `MinecraftProvider` を通して mc-assets のモデル・テクスチャを読みます。配信元は `src/lib/minecraft-assets.ts` の `MINECRAFT_ASSETS_URL`。
- 未ログインで `/dashboard` に来たら、`src/routes/dashboard/route.tsx` の
  `beforeLoad` がサインインへ送ります。

### Worker の env

| 名前 | 種類 | 内容 |
|---|---|---|
| `CLIENT_ID` | var (`cloudflare.config.ts`) | MineAuth の OAuth クライアント ID |
| `AUTH_SECRET` | secret | Better Auth の署名鍵 |
| `SERVER_URL` | secret | サーバー API のベース URL (例: `https://api.morino.party/`)。`<値>servers` の一覧を上から順に試し、OIDC discovery が応答した最初のサーバーを MineAuth の認証サーバーにする |
| `HAGAKI_GITHUB_TOKEN` | secret | wiki-content を読み書きする GitHub トークン |

MineAuth には `https://wiki-frontend.<subdomain>.workers.dev/api/auth/callback/MineAuth`
(ローカルでは `http://localhost:5173/api/auth/callback/MineAuth`) をコールバックとして登録します。

## 初回セットアップ

1. `.env.example` を `.env` にコピーし、値を埋める (`.env` は git 管理外)
   - `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`: cf CLI 用。Worker には渡りません
   - `AUTH_SECRET` / `SERVER_URL` / `HAGAKI_GITHUB_TOKEN`: Worker secret
2. GitHub Actions の secrets にまとめて登録する

   ```sh
   gh secret set -f .env
   ```

`@morinoparty/chlorophyll-react` は GitHub Packages から入れるため、
`~/.npmrc` に `//npm.pkg.github.com/:_authToken=<read:packages の PAT>` が必要です。

## ローカル開発

Node.js 26.12 以上 (`.node-version`) と pnpm 12 (`packageManager`) を使います。

```sh
pnpm install          # prepare で panda codegen も走る
pnpm run dev          # ライセンス一覧と検索 index を作ってから cf dev
```

`cf dev` は Worker secret を `.env` から読みます。生成物だけ作り直すときは
`pnpm run generate`、型チェックは `pnpm run typecheck` です。

## デプロイ

main に push すると `.github/workflows/deploy.yml` が
`pnpm run generate` → `cf build` → `cf deploy --prebuilt --mode production` を実行します。
pull request では dry-run まで行います。Worker secret は GitHub secrets から
ファイルを作り、`cf deploy --secrets-file` で渡します。

検索 index は配信中の wiki-content から作ります。取得に失敗したとき、push (本番 deploy)
では build を止め、PR やローカルでは空の index で続けます。

手元から deploy するときは `.env` の `CLOUDFLARE_*` が使われます。

```sh
pnpm run deploy       # generate → cf build → cf deploy --prebuilt --mode production
```

Worker secret を設定・変更するときは、`--secrets-file` に JSON か `.env` 形式の
ファイルを渡します。`.env` をそのまま渡すと `CLOUDFLARE_*` まで Worker に入るので、
secret 3 つだけのファイルを別に作ってください。
