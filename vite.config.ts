import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// chlorophyll は生の TypeScript ソースで配布され、その中から `styled-system/*` を
// 参照している。tsconfig の paths は型解決にしか効かず、node_modules 配下の
// ソースに対しては bundler が解決できないため、明示的に alias を張る。
const styledSystemDir = path.resolve(import.meta.dirname, "styled-system");

export default defineConfig({
  resolve: {
    alias: {
      "styled-system": styledSystemDir,
    },
    // tsconfig の paths (`@/*`) を Vite が解決する (vite-tsconfig-paths は不要)
    tsconfigPaths: true,
  },
  build: {
    // ハッシュ付きの成果物を public/assets (ハッシュ無しのフォントや画像) と
    // 別のパスに出し、public/_headers で /_build/* だけ immutable にする
    assetsDir: "_build",
  },
  // 設定値だけを読むコマンドではプラグインを初期化しない
  plugins: lazyPlugins(() => [
    // Worker の設定 (名前・バインディング) は cloudflare.config.ts にある
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
  ]),
});
