import type { WikiPost, GetAllPostsOptions } from "@/types/wiki";

// assets/content/wiki ディレクトリ内の全JSONファイルをまとめて取得する関数
export async function getAllPosts(
  options?: GetAllPostsOptions
): Promise<WikiPost[]> {
  try {
    const res = await fetch(
      "https://wiki-contentdev.yahiro.workers.dev/wiki.json",
      {
        cache: "force-cache",
      }
    );

    if (!res.ok) {
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
    }

    const posts = (await res.json()) as WikiPost[];
    console.log(`Successfully fetched ${posts.length} posts`);

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
  } catch (error) {
    console.error("Error fetching posts:", error);

    // ネットワークエラーの場合、空の配列を返してアプリケーションが動作し続けるようにする
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.warn("Network error detected, returning empty posts array");
      return [];
    }

    // その他のエラーは再スローする
    throw error;
  }
}
