import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vinext from "vinext";

// chlorophyll は生の TypeScript ソースで配布され、その中から `styled-system/*` を
// 参照している。tsconfig の paths は型解決にしか効かず、node_modules 配下の
// ソースに対しては bundler が解決できないため、明示的に alias を張る
// (next.config.ts の webpack/turbopack alias と同等の Vite 版)。
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
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
