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
		// TanStack Start の Worker エントリ (SSR / server functions / server routes)
		entrypoint: "@tanstack/react-start/server-entry",
		// 独自ドメインは持たず、https://wiki-frontend.<subdomain>.workers.dev で配信する
		workersDev: true,
		// PR ごとの preview (`cf workers versions create --preview-alias pr-<番号>`) を
		// https://pr-<番号>-wiki-frontend.<subdomain>.workers.dev で開けるようにする
		previewUrls: true,
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
		assets: {
			htmlHandling: "none",
			notFoundHandling: "none",
		},
		env: {
			ASSETS: bindings.assets(),
			// MineAuth の OAuth クライアント ID (公開値)
			CLIENT_ID: bindings.text("01a15d04-65b7-71d3-b069-f9a6d77ad92c"),
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
