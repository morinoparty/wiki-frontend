"use client";

import type { ReactNode } from "react";
import { HagakiImageConfig } from "@morinoparty/hagaki/react";
import { articleImageUrl } from "@/lib/content";

/**
 * 記事本文中の `<Image imageId="…" />` の URL 解決を与えるクライアント境界。
 *
 * `HagakiImageConfig` は `urlFor` に関数を取るため、Server Component から
 * 直接渡すとシリアライズできない。ここでクライアント側に閉じ込める。
 */
export function ContentImageConfig({
  articleId,
  children,
}: {
  articleId: string;
  children: ReactNode;
}) {
  return (
    <HagakiImageConfig
      articleId={articleId}
      urlFor={({ articleId: id, imageId }) => articleImageUrl(id, imageId)}
    >
      {children}
    </HagakiImageConfig>
  );
}
