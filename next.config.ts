import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    path: "./src/lib/image-loader.ts",
  },
  // chlorophyll is published as raw TypeScript sources, so Next has to
  // compile it together with the app.
  transpilePackages: ["@morinoparty/chlorophyll-react"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
