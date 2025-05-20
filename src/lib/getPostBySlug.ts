import type { WikiPostDetail } from "@/types/wiki";

/**
 * 指定したslugに一致するWiki投稿データを取得する関数
 * @param slug 投稿のslug
 * @returns WikiPostDetail | null
 */
export async function getPostBySlug(
  slug: string
): Promise<WikiPostDetail | null> {
  const res = await fetch(
    `https://wiki-contentdev.yahiro.workers.dev/wiki/${encodeURIComponent(slug)}.json`
  );
  if (!res.ok) {
    // 404などの場合はnullを返す
    return null;
  }
  // bodyを含む詳細データとして受け取る
  const post = (await res.json()) as WikiPostDetail;
  return post;
}
