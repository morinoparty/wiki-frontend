import { toUrlSlug } from "hagaki";
import type { WikiPostDetail } from "@/types/wiki";
import { getHagakiClient } from "./hagaki";

/**
 * 指定した slug の記事を取得する。slug → uuid の解決は配信側の
 * `slug-index.json` が行う。
 *
 * `slug-index.json` のキーは `toUrlSlug`（= percent-encoded）なのに対し、
 * Next の動的ルートは復号済みの値を渡してくるため、素の値で引けなければ
 * 正規化した slug で引き直す。
 * @returns 該当が無ければ null
 */
export async function getPostBySlug(
  slug: string
): Promise<WikiPostDetail | null> {
  const posts = getHagakiClient().posts;
  const direct = await posts.getBySlug(slug);
  if (direct) return direct;

  const normalized = toUrlSlug(slug);
  if (normalized === slug) return null;
  return posts.getBySlug(normalized);
}

