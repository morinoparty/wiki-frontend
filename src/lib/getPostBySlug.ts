import type { WikiPostDetail } from "@/types/wiki";
import matter from "gray-matter";

/**
 * 指定したslugに一致するWiki投稿データを取得する関数
 * @param slug 投稿のslug
 * @returns WikiPostDetail | null
 */
export async function getPostBySlug(
  slug: string
): Promise<WikiPostDetail | null> {
  const res = await fetch(
    `https://wiki-contentdev.yahiro.workers.dev/wiki/${encodeURIComponent(slug)}.md`,
    {
      cache: "force-cache",
    }
  );
  if (!res.ok) {
    // 404などの場合はnullを返す
    return null;
  }
  // bodyを含む詳細データとして受け取る
  const markdown = await res.text();
  const { data, content } = matter(markdown);
  const post: WikiPostDetail = {
    title: data.title ?? "",
    slug: data.slug ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    category: data.category ?? "",
    image: data.image,
    body: content,
  };

  return post;
}
