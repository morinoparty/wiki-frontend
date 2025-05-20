import type { WikiPost, GetAllPostsOptions } from "@/types/wiki";

// assets/content/wiki ディレクトリ内の全JSONファイルをまとめて取得する関数
export async function getAllPosts(
  options?: GetAllPostsOptions
): Promise<WikiPost[]> {
  const res = await fetch(
    "https://wiki-contentdev.yahiro.workers.dev/wiki.json"
  );
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  const posts = (await res.json()) as WikiPost[];

  if (options?.sortBy) {
    const { sortBy, order = "desc" } = options;
    posts.sort((a, b) => {
      if (sortBy === "date") {
        // ISO8601日付文字列の比較
        return order === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "title") {
        return order === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return 0;
    });
  }

  return posts;
}
