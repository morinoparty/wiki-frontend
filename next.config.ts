import type { NextConfig } from "next";
import { SAVE_REQUEST_LIMIT_BYTES } from "./src/lib/post-images";

// vinext が読む Next.js 互換の設定。ビルドや alias の設定は vite.config.ts にある。
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 記事の保存は本文と画像 (AVIF, 1 枚 500KB まで) を 1 回の Server Action で
      // 送るので、既定の 1MB では足りない (src/lib/post-images.ts)
      bodySizeLimit: SAVE_REQUEST_LIMIT_BYTES,
    },
  },
};

export default nextConfig;
