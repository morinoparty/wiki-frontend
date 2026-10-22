# インフラ・環境変数

## Worker の env

Worker の env は `getEnv()` (`src/lib/env.ts`) を通して読みます。workerd 上では `cloudflare:workers`、Node のスクリプトでは `process.env` から読みます。

- `CLIENT_ID` - `cloudflare.config.ts` の通常の var (MineAuth の OAuth クライアント ID)
- `AUTH_SECRET`, `SERVER_URL`, `HAGAKI_GITHUB_TOKEN` - Worker secret
  (`bindings.secret()`。ローカルの値は `.env` から読み、デプロイ時は `cf deploy --secrets-file` で渡す)
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` - `cf` CLI 専用 (`.env` / GitHub secrets)。Worker には渡さない

`.env` は git 管理外です (`.env.example` だけコミットする)。
`--secrets-file` に `.env` をそのまま渡すと `CLOUDFLARE_*` まで Worker に入るので、secret 3 つだけのファイルを別に作ります。

## MineAuth サーバー

- `src/lib/server-list.ts` が `${SERVER_URL}servers` を取得し、`/.well-known/openid-configuration` が応答した最初のサーバーを使います
  (`getAuthServerUrl()`、isolate ごとに 60 秒キャッシュ)。
- 特定のサーバーには `getServerUrl(server)` を使ってください。サーバーの URL をハードコードしないでください。
- MineAuth のコールバックは `/api/auth/callback/MineAuth` です (ローカルでは `http://localhost:5173/api/auth/callback/MineAuth`)。

## デプロイ

- デプロイは通常、main への push で `.github/workflows/deploy.yml` から行われます
  (`pnpm run generate` → `pnpm run typecheck` → `cf build` → `cf deploy --prebuilt --mode production`。PR では dry-run まで)。
- PR では `cf workers versions create --preview-alias pr-<番号>` で本番に deploy しない Worker Version を upload し、preview の URL を PR にコメントします。preview は本番の secret を引き継ぐので、preview からの保存も wiki-content にコミットされます。
- 検索 index は配信中の wiki-content から作ります。取得に失敗したとき、push (本番 deploy) では build を止め、PR やローカルでは空の index で続けます。
- 手元からデプロイ (`pnpm run deploy` / `cf deploy`) や Worker secret の変更など、リモートの状態を変える操作は、ユーザーに明示的に指示されない限り行わないでください。検証には `pnpm exec cf deploy --dry-run` を使ってください。
