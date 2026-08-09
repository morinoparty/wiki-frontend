import path from "node:path";
import type { NextConfig } from "next";

// chlorophyll は生の TypeScript ソースで配布され、その中から `styled-system/*` を
// 参照している。tsconfig の paths は型解決にしか効かず、node_modules 配下の
// ソースに対しては bundler が解決できないため、明示的に alias を張る。
const styledSystemDir = path.join(process.cwd(), "styled-system");

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    path: "./src/lib/image-loader.ts",
  },
  // chlorophyll is published as raw TypeScript sources, so Next has to
  // compile it together with the app.
  transpilePackages: ["@morinoparty/chlorophyll-react"],
  turbopack: {
    resolveAlias: {
      "styled-system/css": "./styled-system/css",
      "styled-system/recipes": "./styled-system/recipes",
      "styled-system/patterns": "./styled-system/patterns",
      "styled-system/tokens": "./styled-system/tokens",
      "styled-system/jsx": "./styled-system/jsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "styled-system": styledSystemDir,
    };
    // chlorophyll の package.json には sideEffects: false が無いため、
    // barrel(`/components`)を import すると SkinViewer 経由で three.js まで
    // バンドルに残ってしまう。ソースは純粋なコンポーネント定義だけなので、
    // 利用側から副作用なしと宣言して tree shaking を効かせる。
    config.module.rules.push({
      test: /[\\/]@morinoparty[\\/]chlorophyll-react[\\/]src[\\/].*\.tsx?$/,
      sideEffects: false,
    });
    return config;
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
