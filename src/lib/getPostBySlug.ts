import type { WikiPostDetail } from "@/types/wiki";
import { getHagakiClient } from "./hagaki";

/**
 * 指定した slug の記事を取得する。slug → uuid の解決は配信側の
 * `slug-index.json` が行う。
 * @returns 該当が無ければ null
 */
export async function getPostBySlug(
  slug: string
): Promise<WikiPostDetail | null> {
  return getHagakiClient().posts.getBySlug(slug);
}

/** uuid 指定で記事を取得する (ダッシュボードの編集画面など)。 */
export async function getPostByUuid(
  uuid: string
): Promise<WikiPostDetail | null> {
  return getHagakiClient().posts.getByUuid(uuid);
}
