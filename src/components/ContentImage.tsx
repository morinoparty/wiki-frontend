import { Image, type HagakiImageProps } from "@morinoparty/hagaki/react";

/**
 * `hagaki/react` の `<Image>` のラッパ。本文中の `<Image imageId="…" />` を
 * 描画する。URL 解決は `<ContentImageConfig>` が供給する。
 */
export function ContentImage(props: HagakiImageProps) {
  return <Image {...props} />;
}

export type { HagakiImageProps };
