import type { ReactNode } from "react";
import { HagakiImageConfig } from "@morinoparty/hagaki/react";
import { articleImageUrl } from "@/lib/content";

/**
 * 記事本文中の `<Image imageId="…" />` の URL 解決を与える。
 * 画像は配信元 (`CONTENT_BASE_URL`) の `article/<uuid>/assets/` から読む。
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
