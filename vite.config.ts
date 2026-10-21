import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vinext from "vinext";

// chlorophyll は生の TypeScript ソースで配布され、その中から `styled-system/*` を
// 参照している。tsconfig の paths は型解決にしか効かず、node_modules 配下の
// ソースに対しては bundler が解決できないため、明示的に alias を張る。
const styledSystemDir = path.resolve(import.meta.dirname, "styled-system");

export default defineConfig({
  resolve: {
    alias: {
      "styled-system": styledSystemDir,
    },
  },
  plugins: [
    // NOTE: @vitejs/plugin-rsc は vinext が app/ を検出して自動登録するため、
    // ここで明示的に登録してはいけない (二重登録はビルドエラーになる)。
    vinext(),
    // Worker の設定 (名前・バインディング) は cloudflare.config.ts にある
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
