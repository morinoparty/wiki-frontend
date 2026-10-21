import { bindings, defineConfig } from "cf/config";

// accountId は書かない。CLOUDFLARE_ACCOUNT_ID (.env / GitHub secrets) で渡す。
export default defineConfig({
	worker: {
		name: "wiki-frontend",
		compatibilityDate: "2026-02-12",
		compatibilityFlags: [
			// Node.js API (better-auth / octokit が使う)
			"nodejs_compat",
			// fetch 先を公開アドレスに限る
			"global_fetch_strictly_public",
		],
		// vinext の Worker エントリ。App Router / Pages Router をビルド時に選ぶ
		entrypoint: "vinext/server/fetch-handler",
		// 独自ドメインは持たず、https://wiki-frontend.<subdomain>.workers.dev で配信する
		workersDev: true,
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
		assets: {
			htmlHandling: "none",
			notFoundHandling: "none",
			// ハッシュ付きのクライアント資産以外はすべて vinext (middleware / ルーティング) を通す
			runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
		},
		env: {
			ASSETS: bindings.assets(),
			// MineAuth の OAuth クライアント ID (公開値)
			CLIENT_ID: bindings.text("019fe59c-1673-72f5-a5d2-49cce1d4161f"),
			// 以下は Worker secret。deploy 時に `cf deploy --secrets-file` で渡し、
			// ローカルでは .env から読む (src/lib/env.ts)
			// Better Auth の署名鍵
			AUTH_SECRET: bindings.secret(),
			// サーバー API のベース URL (例: https://api.morino.party/)。
			// `<値>servers` のリストから MineAuth (OIDC) の認証サーバーを解決する
			SERVER_URL: bindings.secret(),
			// morinoparty/wiki-content を読み書きする GitHub トークン
			HAGAKI_GITHUB_TOKEN: bindings.secret(),
		},
	},
});
